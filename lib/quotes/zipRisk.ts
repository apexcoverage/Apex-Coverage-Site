import { AUTO_RATE_TABLE } from "./rateTables";
import {
  ZIP_RISK_BUCKETS,
  ZIP_RISK_DATA_VERSION,
  ZIP_RISK_METHOD,
  ZIP_RISK_PREFIX_BUCKETS,
  type ZipRiskBucket,
} from "./zipRiskData";

export type ZipRiskLookupResult = {
  zip: string;
  bucket: ZipRiskBucket;
  factor: number;
  matchType: "exact" | "prefix" | "default";
  dataVersion: string;
  method: string;
};

function cleanZip(value: string) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}

export function lookupZipRisk(value: string): ZipRiskLookupResult {
  const zip = cleanZip(value);
  const exactBucket = ZIP_RISK_BUCKETS[zip];

  if (exactBucket) {
    return {
      zip,
      bucket: exactBucket,
      factor: AUTO_RATE_TABLE.zipFactors[exactBucket],
      matchType: "exact",
      dataVersion: ZIP_RISK_DATA_VERSION,
      method: ZIP_RISK_METHOD.method,
    };
  }

  const prefixBucket = zip.length >= 3 ? ZIP_RISK_PREFIX_BUCKETS[zip.slice(0, 3)] : undefined;
  if (prefixBucket) {
    return {
      zip,
      bucket: prefixBucket,
      factor: AUTO_RATE_TABLE.zipFactors[prefixBucket],
      matchType: "prefix",
      dataVersion: ZIP_RISK_DATA_VERSION,
      method: ZIP_RISK_METHOD.method,
    };
  }

  return {
    zip,
    bucket: "Average",
    factor: AUTO_RATE_TABLE.zipFactors.Average,
    matchType: "default",
    dataVersion: ZIP_RISK_DATA_VERSION,
    method: ZIP_RISK_METHOD.method,
  };
}

export { ZIP_RISK_DATA_VERSION, ZIP_RISK_METHOD };
