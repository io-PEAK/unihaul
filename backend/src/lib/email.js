import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Student Shop <onboarding@resend.dev>'

export async function sendOtpEmail({ to, otp, type }) {
  const isEmailChange = type === 'email_change'

  const subject = isEmailChange
    ? 'Verify your email change — Student Shop'
    : 'Reset your password — Student Shop'

  const heading = isEmailChange
    ? 'Email Change Verification'
    : 'Password Reset Code'

  const message = isEmailChange
    ? 'You requested to change your email address. Use the code below to verify.'
    : 'You requested a password reset. Use the code below to set a new password.'

  // Each digit gets its own styled box
  const digits = otp.split('').map(d =>
    `<td style="padding:0 4px;">
      <div style="width:48px;height:58px;background:#1a1a1a;border:1.5px solid #2e2e2e;border-radius:10px;text-align:center;line-height:58px;font-size:26px;font-weight:800;color:#e87722;font-family:'Courier New',monospace;display:inline-block;">${d}</div>
    </td>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d0d0d;padding:48px 20px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

      <!-- CARD -->
      <tr><td style="background:#161616;border:1px solid #252525;border-radius:20px;overflow:hidden;">

        <!-- Accent bar -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="height:4px;background:linear-gradient(90deg,#c45e0a,#e87722,#ff9a3c,#e87722,#c45e0a);"></td>
        </tr></table>

        <!-- LOGO -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:30px 40px 24px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#e87722,#ff9a3c);border-radius:10px;width:38px;height:38px;">
                  <tr><td style="text-align:center;vertical-align:middle;width:38px;height:38px;">
                    <span style="color:#fff;font-size:19px;font-weight:900;line-height:1;">S</span>
                  </td></tr>
                </table>
              </td>
              <td style="vertical-align:middle;padding-left:10px;">
                <span style="color:#fff;font-size:15px;font-weight:800;letter-spacing:0.3px;">STUDENT</span>
                <span style="color:#e87722;font-size:15px;font-weight:800;letter-spacing:0.3px;"> SHOP</span>
              </td>
            </tr></table>
          </td>
        </tr></table>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:0 40px;"><div style="height:1px;background:#222;"></div></td>
        </tr></table>

        <!-- HEADING -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:28px 40px 0;">
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.3px;line-height:1.25;">${heading}</h1>
            <p style="margin:0;font-size:14px;color:#777;line-height:1.7;">${message}</p>
          </td>
        </tr></table>

        <!-- OTP BOX -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:24px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:14px;">
              <tr><td style="padding:26px 20px 8px;text-align:center;">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#444;margin-bottom:20px;">Verification Code</div>
                <!-- Digit boxes -->
                <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>${digits}</tr></table>
              </td></tr>
              <tr><td style="padding:14px 20px 24px;text-align:center;">
                <span style="font-size:12px;color:#444;">Expires in </span>
                <span style="font-size:12px;font-weight:700;color:#666;">3 minutes</span>
              </td></tr>
            </table>
          </td>
        </tr></table>

        <!-- SAFETY NOTE -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:20px 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1c1c1c;border:1px solid #272727;border-radius:10px;">
              <tr><td style="padding:13px 16px;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="vertical-align:top;padding-right:9px;width:18px;">
                    <table cellpadding="0" cellspacing="0" style="background:#2a2a2a;border-radius:50%;width:17px;height:17px;"><tr>
                      <td style="text-align:center;vertical-align:middle;font-size:10px;font-weight:800;color:#555;line-height:17px;width:17px;height:17px;">i</td>
                    </tr></table>
                  </td>
                  <td style="font-size:12px;color:#555;line-height:1.65;">
                    If you didn't request this, you can safely ignore this email. Your account has not been changed.
                  </td>
                </tr></table>
              </td></tr>
            </table>
          </td>
        </tr></table>

      </td></tr>
      <!-- END CARD -->

      <!-- FOOTER -->
      <tr><td style="padding:20px 8px 0;text-align:center;">
        <p style="margin:0;font-size:11px;color:#333;line-height:1.9;">
          Sent by <span style="color:#4a4a4a;font-weight:600;">Student Shop</span> · Campus Buy &amp; Sell<br>
          This is an automated message — please do not reply.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: FROM,
    to: process.env.DEV_EMAIL || to,
    subject,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error('Failed to send email')
  }

  console.log(`✅ OTP email sent to ${to} — code: ${otp}`)
}