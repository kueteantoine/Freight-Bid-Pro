import { Zap, Shield, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

export function LandingFeatures() {
  const t = useTranslations("landing.features");
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">{t("realTimeBidding.title")}</h3>
            <p className="text-muted-foreground">
              {t("realTimeBidding.description")}
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">{t("securePayments.title")}</h3>
            <p className="text-muted-foreground">
              {t("securePayments.description")}
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">{t("realTimeTracking.title")}</h3>
            <p className="text-muted-foreground">
              {t("realTimeTracking.description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}