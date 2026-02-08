"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Shipment, Bid, Profile } from "@/lib/types/database";
import { User } from "@supabase/supabase-js";

interface RealtimeBidsHook {
  activeShipments: Shipment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper to calculate bid expiry time
const calculateExpiry = (shipment: any): string | null => {
  if (shipment.auction_type === 'standard' && shipment.bidding_duration_minutes) {
    const created = new Date(shipment.created_at).getTime();
    const durationMs = shipment.bidding_duration_minutes * 60 * 1000;
    const expiryTime = created + durationMs;
    return new Date(expiryTime).toISOString();
  }
  return null;
};

export function useRealtimeBids(): RealtimeBidsHook {
  const [user, setUser] = useState<User | null>(null);
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const fetchActiveShipments = useCallback(async () => {
    if (!user) {
      if (!isLoading) setIsLoading(true); // Ensure loading is true if user is missing but we're starting
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: shipmentsData, error: shipmentError } = await supabase
        .from("shipments")
        .select(`
          *,
          bids (
            *,
            profiles (
              first_name, 
              last_name, 
              avatar_url,
              user_ad_subscriptions!user_id (
                subscription_status,
                ad_subscription_tiers!tier_id (
                  tier_slug
                )
              )
            )
          )
        `)
        .eq("shipper_user_id", user.id)
        .eq("status", "open_for_bidding")
        .order("created_at", { ascending: false });

      if (shipmentError) throw shipmentError;

      const processedShipments: Shipment[] = (shipmentsData || []).map((s: any) => ({
        ...s,
        bids: s.bids.filter((b: Bid) => b.bid_status === 'active').sort((a: Bid, b: Bid) => a.bid_amount - b.bid_amount),
        bid_expires_at: calculateExpiry(s),
      }));

      setActiveShipments(processedShipments);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to load active shipments.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchActiveShipments();
    } else {
      // If we've checked for user and none is found, stop loading
      supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
        if (!currentUser) {
          setIsLoading(false);
        }
      });
    }
  }, [user, fetchActiveShipments]);

  // Realtime Subscription Logic
  useEffect(() => {
    if (!user || activeShipments.length === 0) return;

    const channel = supabase.channel(`shipper_bidding_${user.id}`);

    // Handle new bids
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `shipment_id=in.(${activeShipments.map(s => s.id).join(',')})`
      },
      (payload) => {
        const newBid = payload.new as Bid;

        // Fetch the transporter profile for the new bid
        supabase.from('profiles').select('id, first_name, last_name, avatar_url, user_ad_subscriptions!user_id(subscription_status, ad_subscription_tiers!tier_id(tier_slug))').eq('id', newBid.transporter_user_id).single()
          .then(({ data: profileData }) => {
            if (profileData) {
              const bidWithProfile = { ...newBid, profiles: profileData as any };

              setActiveShipments(prevShipments => {
                const shipmentIndex = prevShipments.findIndex(s => s.id === newBid.shipment_id);
                if (shipmentIndex === -1) return prevShipments;

                const updatedShipments = [...prevShipments];
                const currentShipment = updatedShipments[shipmentIndex];

                // Check if this bid is already present (e.g., from initial fetch)
                if (currentShipment.bids.some((b: Bid) => b.id === newBid.id)) return prevShipments;

                const newBids = [...currentShipment.bids, bidWithProfile].sort((a, b) => a.bid_amount - b.bid_amount);

                updatedShipments[shipmentIndex] = {
                  ...currentShipment,
                  bids: newBids,
                };

                toast.info(`New bid received for ${currentShipment.shipment_number || currentShipment.id.slice(0, 8)}!`, {
                  description: `Transporter ${profileData.first_name} bid XAF ${newBid.bid_amount.toLocaleString()}.`,
                });

                return updatedShipments;
              });
            }
          });
      }
    ).subscribe();

    // Handle subscription for bid updates (e.g., outbid, rejected, awarded)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bids',
        filter: `shipment_id=in.(${activeShipments.map(s => s.id).join(',')})`
      },
      (payload) => {
        const updatedBid = payload.new as Bid;
        setActiveShipments(prevShipments => {
          return prevShipments.map(s => {
            if (s.id !== updatedBid.shipment_id) return s;

            const updatedBids = s.bids.map(b => b.id === updatedBid.id ? { ...b, ...updatedBid } : b);

            // If bid became inactive, filter it out
            const activeBids = updatedBids.filter(b => b.bid_status === 'active').sort((a, b) => a.bid_amount - b.bid_amount);

            return { ...s, bids: activeBids };
          });
        });

        if (updatedBid.transporter_user_id === user.id && updatedBid.bid_status === 'outbid') {
          toast.warning("You have been outbid!", {
            description: "Check the load board to submit a new offer.",
          });
        }
      }
    ).subscribe();

    // Handle shipment changes (status and bid_expires_at)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments',
        filter: `shipper_user_id=eq.${user.id}`
      },
      (payload) => {
        const updatedShipment = payload.new as Shipment;
        const oldShipment = payload.old as Shipment;

        // Handle snipe protection (expiry extension)
        if (updatedShipment.bid_expires_at !== oldShipment.bid_expires_at) {
          setActiveShipments(prev => prev.map(s => s.id === updatedShipment.id ? { ...s, bid_expires_at: updatedShipment.bid_expires_at } : s));
          toast.info("Auction time extended!", {
            description: "A bid was placed in the final minutes, giving more time to participate.",
          });
        }

        if (updatedShipment.status !== 'open_for_bidding') {
          toast.success(`Shipment ${updatedShipment.shipment_number || updatedShipment.id.slice(0, 8)} status updated to ${updatedShipment.status}.`);
          fetchActiveShipments();
        }
      }
    ).subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeShipments, fetchActiveShipments]);

  return { activeShipments, isLoading, error, refetch: fetchActiveShipments };
}