"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { driverService } from "@/lib/services/driver-service";

const timeOffSchema = z.object({
    dateRange: z.object({
        from: z.date(),
        to: z.date(),
    }, {
        required_error: "Please select a date range",
    }),
    reason: z.string().min(5, "Reason is required (min 5 characters)"),
});

export function TimeOffRequestForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof timeOffSchema>>({
        resolver: zodResolver(timeOffSchema),
        defaultValues: {
            reason: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof timeOffSchema>) => {
        try {
            setIsSubmitting(true);

            // We need to fetch the transporter ID for the request
            // Assuming the active assignment has the transporter ID
            const assignment = await driverService.getMyActiveAssignment();

            if (!assignment) {
                toast.error("You must have an active assignment to request time off.");
                return;
            }

            await driverService.requestTimeOff({
                transporter_user_id: assignment.transporter_user_id,
                start_date: values.dateRange.from.toISOString().split('T')[0],
                end_date: values.dateRange.to.toISOString().split('T')[0],
                reason: values.reason,
            });

            toast.success("Time off request submitted");
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error requesting time off:", error);
            toast.error("Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date Range</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                    <>
                                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                                        {format(field.value.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(field.value.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={field.value?.from}
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        numberOfMonths={2}
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="e.g., Vacation, Medical appointment..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
            </form>
        </Form>
    );
}
