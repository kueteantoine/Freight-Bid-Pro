"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FAQSection } from "@/components/shipper/support/FAQSection";
import { SupportTicketSystem } from "@/components/shipper/support/SupportTicketSystem";
import { TutorialLibrary } from "@/components/shipper/support/TutorialLibrary";
import { LiveChatWidget } from "@/components/shipper/support/LiveChatWidget";
import {
    LifeBuoy,
    HelpCircle,
    MessageSquare,
    Video,
    ShieldAlert,
    ExternalLink,
    Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function ShipperSupportPage() {
    const t = useTranslations("shipperSubPages");
    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <LifeBuoy className="w-8 h-8 text-primary" />
                        {t("supportCenter")}
                    </h1>
                    <p className="text-slate-500 mt-1">{t("supportCenterDesc")}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-slate-200">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        {t("reportSecurityIssue")}
                    </Button>
                    <Button variant="outline" className="gap-2 border-slate-200">
                        <ExternalLink className="w-4 h-4" />
                        {t("documentation")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow border-slate-200">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{t("knowledgeBase")}</h3>
                            <p className="text-xs text-slate-500">{t("knowledgeBaseDesc")}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow border-slate-200">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{t("supportTickets")}</h3>
                            <p className="text-xs text-slate-500">{t("supportTicketsDesc")}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow border-slate-200">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Video className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{t("tutorials")}</h3>
                            <p className="text-xs text-slate-500">{t("tutorialsDesc")}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="faq" className="w-full space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl w-full md:w-auto h-auto">
                    <TabsTrigger value="faq" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <HelpCircle className="w-4 h-4" />
                        {t("faqs")}
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {t("supportTickets")}
                    </TabsTrigger>
                    <TabsTrigger value="tutorials" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Video className="w-4 h-4" />
                        {t("videoTutorials")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="faq" className="mt-0 ring-offset-transparent focus-visible:ring-0">
                    <FAQSection />
                </TabsContent>

                <TabsContent value="tickets" className="mt-0 ring-offset-transparent focus-visible:ring-0">
                    <SupportTicketSystem />
                </TabsContent>

                <TabsContent value="tutorials" className="mt-0 ring-offset-transparent focus-visible:ring-0">
                    <TutorialLibrary />
                </TabsContent>
            </Tabs>

            <LiveChatWidget />
        </div>
    );
}
