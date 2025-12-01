import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } =
      evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    const role = (public_metadata?.role as UserRole) || UserRole.CLIENT;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name,
        profileImage: image_url,
        role,
      },
      create: {
        id,
        email,
        name,
        profileImage: image_url,
        role,
      },
    });

    // 상담사 역할인 경우 프로필도 생성
    if (role === UserRole.COUNSELOR) {
      await prisma.counselor.upsert({
        where: { userId: id },
        update: {},
        create: {
          userId: id,
        },
      });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (id) {
      // 상담사 프로필 삭제
      await prisma.counselor.deleteMany({
        where: { userId: id },
      });

      // 사용자 삭제
      await prisma.user.delete({
        where: { id },
      }).catch(() => {
        // 사용자가 없을 수 있음
      });
    }
  }

  return new Response("", { status: 200 });
}
