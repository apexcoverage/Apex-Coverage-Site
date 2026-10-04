import Script from "next/script";

const defaultGoogleAdsId = "AW-18491289640";
const googleAdsId =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_ADS_AD_LEAD_SEND_TO?.split("/")[0] ||
  defaultGoogleAdsId;
const googleAdsIdScriptValue = JSON.stringify(googleAdsId);

export default function GoogleAdsTag() {
  if (!googleAdsId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-ads-tag"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', ${googleAdsIdScriptValue});
          `,
        }}
      />
    </>
  );
}
