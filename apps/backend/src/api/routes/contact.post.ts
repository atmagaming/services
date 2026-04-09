import { handler } from "api/utils";
import { env } from "env";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(env.RESEND_API_KEY);

export default handler(
  {
    body: {
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      message: z.string().min(1, "Message is required"),
    },
  },
  async ({ body: { name, email, message } }) => {
    try {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: "hello@atmagaming.com",
        replyTo: email,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      });

      return { success: true, message: "Thank you for your message. We'll get back to you soon!" };
    } catch (e) {
      console.error("Failed to send contact email:", e);
      throw new Error("Failed to send contact form: " + (e instanceof Error ? e.message : String(e)));
    }
  },
);
