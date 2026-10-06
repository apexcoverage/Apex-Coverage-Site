import Script from "next/script";

const defaultGoogleAdsId = "AW-18491289640";
const defaultAdLeadConversionSendTo =
  "AW-18491289640/GZzFCJq50Y4dEKjgqvFE";
const googleAdsId =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_ADS_AD_LEAD_SEND_TO?.split("/")[0] ||
  defaultGoogleAdsId;
const adLeadConversionLabel =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_AD_LEAD_CONVERSION_LABEL;
const adLeadConversionSendTo =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_AD_LEAD_SEND_TO ||
  (googleAdsId && adLeadConversionLabel
    ? `${googleAdsId}/${adLeadConversionLabel}`
    : defaultAdLeadConversionSendTo);
const googleAdsIdScriptValue = JSON.stringify(googleAdsId);
const adLeadConversionSendToScriptValue = JSON.stringify(adLeadConversionSendTo);

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
            window.gtag_report_conversion = function(url) {
              var callback = function () {
                if (typeof url !== 'undefined') {
                  window.location = url;
                }
              };
              window.gtag('event', 'conversion', {
                'send_to': ${adLeadConversionSendToScriptValue},
                'value': 1.0,
                'currency': 'USD',
                'event_callback': callback
              });
              return false;
            };
          `,
        }}
      />
    </>
  );
}
