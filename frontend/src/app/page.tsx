"use client";

import { useAuth } from "./context/AuthContext";
import { IDKitWidget, VerificationLevel, useIDKit } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";
import { verify } from "./context/verify";

export default function Home() {
  const { setIsVerified } = useAuth();
  const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`;
  const action = process.env.NEXT_PUBLIC_WLD_ACTION;

  if (!app_id || !action) {
    throw new Error("App ID and Action are not set in environment variables!");
  }

  const { setOpen } = useIDKit();

  const onSuccess = (result: ISuccessResult) => {
    setIsVerified(true);
    console.log(
      "Successfully verified with World ID! Your nullifier hash is: " +
        result.nullifier_hash,
    );
    window.location.href = "/top";
  };

  const handleProof = async (result: ISuccessResult) => {
    const data = await verify(result);
    if (data.success) {
      setIsVerified(true);
    } else {
      throw new Error(`Verification failed: ${data.detail}`);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage: `url('/path/to/your/background/image.png')`,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <h1 className="text-4xl mb-5 font-bold">Onchain Senryu</h1>
      <p className="text-xl mb-5 text-center">
        Welcome! Please verify to enter.
      </p>
      <p className="text-lg mb-5 px-8 text-center">
        This platform is dedicated to the art of Senryu, a form of short
        Japanese poetry. Senryu are often humorous or satirical, reflecting
        human nature. To explore and contribute, please verify your identity.
      </p>
      <IDKitWidget
        action={action}
        app_id={app_id}
        onSuccess={onSuccess}
        handleVerify={handleProof}
        verification_level={VerificationLevel.Orb}
      />
      <button
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md"
        onClick={() => setOpen(true)}
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          textTransform: "none",
        }}
      >
        Enter
      </button>
    </div>
  );
}
