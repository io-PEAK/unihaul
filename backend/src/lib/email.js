import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "UniHaul <onboarding@resend.dev>";

export async function sendOtpEmail({ to, otp, type }) {
  const isEmailChange = type === "email_change";

  const subject = isEmailChange
    ? "Verify your email change — UniCart"
    : "Reset your password — UniCart";

  const heading = isEmailChange
    ? "Email Change Verification"
    : "Password Reset Code";

  const message = isEmailChange
    ? "You requested to change your email address. Use the code below to verify."
    : "You requested a password reset. Use the code below to set a new password.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#080810;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080810;padding:60px 20px;">
  <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;">

      <!-- LOGO AREA -->
      <tr><td style="padding-bottom:32px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
          <td style="vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" style="background:#e87722;border-radius:12px;width:44px;height:44px;">
              <tr><td style="text-align:center;vertical-align:middle;padding:8px;">
                <img src="https://unihaul.vercel.app/favicon.svg" width="28" height="28" style="display:block;margin:0 auto;" alt="S">
              </td></tr>
            </table>
          </td>
          <td style="vertical-align:middle;padding-left:14px;">
            <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:-0.5px;line-height:1;">STUDENT <span style="color:#e87722;">SHOP</span></div>
          </td>
        </tr></table>
      </td></tr>

      <!-- MAIN CARD -->
      <tr><td style="background:#12121e;border:1px solid #2a2a3a;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.5);">
        
        <!-- Header Gradient Bar (Ember Theme) -->
        <div style="height:4px;background:linear-gradient(90deg,#e87722,#f5a623,#e87722);"></div>

        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:44px 40px;">
            
            <!-- HEADING -->
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.8px;line-height:1.2;">${heading}</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;font-weight:400;">${message}</p>

            <!-- CONVENIENT OTP BOX -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;background:rgba(232,119,34,0.08);border:2px dashed rgba(232,119,34,0.4);border-radius:20px;">
              <tr><td style="padding:32px 20px;text-align:center;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin-bottom:16px;">Copy your verification code</div>
                
                <div style="display:inline-block;padding:12px 32px;background:#1a1a24;border:1px solid #333344;border-radius:14px;box-shadow:0 10px 25px rgba(0,0,0,0.3);">
                  <span style="font-size:36px;font-weight:900;color:#e87722;font-family:'Courier New',monospace;letter-spacing:6px;user-select:all;">${otp}</span>
                </div>

                <div style="margin-top:20px;">
                  <div style="display:inline-block;padding:6px 14px;background:rgba(232,119,34,0.12);border-radius:20px;">
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">Expires in </span>
                    <span style="font-size:13px;font-weight:700;color:#e87722;">3 minutes</span>
                  </div>
                </div>
              </td></tr>
            </table>

            <!-- INFO NOTE -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
              <tr><td style="padding:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="vertical-align:top;padding-right:12px;">
                    <div style="width:20px;height:20px;background:#e87722;border-radius:50%;color:#ffffff;font-size:12px;font-weight:bold;text-align:center;line-height:20px;">i</div>
                  </td>
                  <td style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
                    To protect your account, do not share this code with anyone. Our team will never ask for this code.
                  </td>
                </tr></table>
              </td></tr>
            </table>

          </td>
        </tr></table>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:32px 20px 0;text-align:center;">
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.8;letter-spacing:0.2px;">
          Sent by <span style="color:rgba(255,255,255,0.5);font-weight:700;">UniHaul</span><br>
          An automated security message. Please do not reply.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: process.env.DEV_EMAIL || to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Failed to send email");
  }

  console.log(`✅ OTP email sent to ${to} — code: ${otp}`);
}
