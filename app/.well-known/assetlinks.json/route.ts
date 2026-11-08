import { NextResponse } from "next/server";

// Digital Asset Links for the Android TWA wrapper (Bubblewrap).
// Fingerprint = SHA-256 of android/plannly-release.keystore (alias plannly).
export async function GET() {
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "ai.plannlyai.twa",
        sha256_cert_fingerprints: [
          "08:A9:E1:10:79:39:55:77:1F:6D:CB:DB:8B:07:B4:F7:EC:C9:32:3E:CC:B3:FE:60:79:A7:90:4E:B5:AA:1F:E3",
        ],
      },
    },
  ]);
}
