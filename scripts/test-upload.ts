import { POST as handleUpload } from "../src/app/api/upload/route";
import { signToken } from "../src/lib/auth";

async function testUpload() {
  console.log("--- Testing /api/upload endpoint ---");

  const token = signToken({ sub: "admin", email: "admin@blackorchid.com", role: "ADMIN" });

  // Create a 1x1 transparent PNG buffer
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const file = new File([samplePngBuffer], "test-dish.png", { type: "image/png" });
  const formData = new FormData();
  formData.append("file", file);

  const req = new Request("http://localhost:3000/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const res = await handleUpload(req);
  const data = await res.json();

  console.log("Upload response status:", res.status);
  console.log("Upload result URL preview:", data.url ? data.url.slice(0, 60) + "..." : data);

  if (res.status === 201 && data.url) {
    console.log("✅ /api/upload TEST PASSED! Image successfully processed and URL returned!");
  } else {
    console.error("❌ /api/upload TEST FAILED!", data);
  }
}

testUpload().catch(console.error);
