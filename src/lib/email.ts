import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'reservations@hellocasita.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'reservations@hellocasita.com';

// Generic email sending function via SendGrid
async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return { success: false, error: 'SendGrid API key not configured' };
    }

    await sgMail.send({
      to,
      from: {
        email: FROM_EMAIL.includes('<') ? FROM_EMAIL.match(/<(.+)>/)?.[1] || FROM_EMAIL : FROM_EMAIL,
        name: 'Casita',
      },
      subject,
      html,
    });

    console.log(`Email sent via SendGrid to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);

    // Handle SendGrid specific errors
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as { response?: { body?: { errors?: Array<{ message: string }> } } };
      const errorMessage = sgError.response?.body?.errors?.[0]?.message || 'SendGrid error';
      return { success: false, error: errorMessage };
    }

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface BookingConfirmationData {
  guestName: string;
  guestEmail: string;
  confirmationCode: string;
  propertyName: string;
  propertyImage?: string;
  propertyAddress: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  nightsCount: number;
  pricing: {
    accommodation: number;
    cleaningFee: number;
    serviceFee?: number;
    taxes: number;
    total: number;
    currency: string;
  };
  checkInTime?: string;
  checkOutTime?: string;
  hostName?: string;
  hostPhone?: string;
  specialInstructions?: string;
  propertyType?: 'self-checkin' | 'hotel' | 'other'; // For check-in instructions
}

interface InquiryConfirmationData {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  propertyImage?: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  message?: string;
}

// Format currency for display
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate booking confirmation email HTML - Marriott-inspired elegant design
function generateBookingConfirmationHTML(data: BookingConfirmationData): string {
  const {
    guestName,
    confirmationCode,
    propertyName,
    propertyImage,
    propertyAddress,
    checkIn,
    checkOut,
    guestsCount,
    nightsCount,
    pricing,
    checkInTime = '3:00 PM',
    checkOutTime = '11:00 AM',
    hostName,
    hostPhone,
    specialInstructions,
    propertyType = 'self-checkin',
  } = data;

  // Casita brand colors
  const casitaOrange = '#E8A07A';
  const casitaCream = '#FDF8F5';
  const casitaSand = '#F4E4D4';
  const casitaGray = '#525252';
  const casitaDark = '#171717';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - Casita</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${casitaCream};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; overflow: hidden;">

          <!-- Decorative Top Border -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${casitaOrange} 0%, ${casitaSand} 50%, ${casitaOrange} 100%);"></td>
          </tr>

          <!-- Logo Header -->
          <tr>
            <td style="padding: 40px 40px 16px 40px; text-align: center; background-color: #ffffff;">
              <img src="https://casita-beapi.vercel.app/casita-logo.png" alt="Casita" style="height: 50px; width: auto;" />
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center; background-color: #ffffff;">
              <img src="https://hellocasita.com/icon-512.png" alt="" style="height: 60px; width: 60px;" />
            </td>
          </tr>

          <!-- Elegant Divider -->
          <tr>
            <td style="padding: 0 60px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                  <td style="width: 60px; text-align: center; padding: 0 15px;">
                    <span style="color: ${casitaOrange}; font-size: 18px;">🏠</span>
                  </td>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Title -->
          <tr>
            <td style="padding: 32px 40px 16px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 32px; font-weight: 600; color: ${casitaDark}; letter-spacing: 1px;">
                Reservation Confirmed
              </h1>
            </td>
          </tr>

          <!-- Confirmation Code Badge -->
          <tr>
            <td style="padding: 0 40px 32px 40px; text-align: center;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: ${casitaCream}; border: 1px solid ${casitaSand}; border-radius: 4px; padding: 12px 24px;">
                    <span style="color: ${casitaGray}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Confirmation Number</span>
                    <br/>
                    <span style="color: ${casitaOrange}; font-size: 20px; font-weight: 600; letter-spacing: 2px;">${confirmationCode}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0; color: ${casitaDark}; font-size: 16px; line-height: 1.7;">
                Dear ${guestName},
              </p>
              <p style="margin: 16px 0 0 0; color: ${casitaGray}; font-size: 15px; line-height: 1.7;">
                Thank you for choosing Casita. We are delighted to confirm your upcoming stay at <strong style="color: ${casitaDark};">${propertyName}</strong>. Below you will find your complete reservation details.
              </p>
            </td>
          </tr>

          <!-- Property Image -->
          ${propertyImage ? `
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <img src="${propertyImage}" alt="${propertyName}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 4px;">
            </td>
          </tr>
          ` : ''}

          <!-- Property Details Card -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; border-radius: 4px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 8px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: ${casitaDark};">
                      ${propertyName}
                    </h2>
                    <p style="margin: 0; color: ${casitaGray}; font-size: 14px;">
                      📍 ${propertyAddress}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stay Details Section Header -->
          <tr>
            <td style="padding: 0 40px 16px 40px;">
              <h3 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 600; color: ${casitaDark}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid ${casitaOrange}; display: inline-block; padding-bottom: 4px;">
                Stay Details
              </h3>
            </td>
          </tr>

          <!-- Check-in / Check-out Dates -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="background-color: #ffffff; border: 1px solid ${casitaSand}; border-radius: 4px; padding: 20px; vertical-align: top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Check-In</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 600; color: ${casitaDark};">${formatDate(checkIn)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;">
                          <span style="color: ${casitaGray}; font-size: 13px;">After ${checkInTime}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="4%" style="text-align: center; vertical-align: middle;">
                    <span style="color: ${casitaSand}; font-size: 24px;">→</span>
                  </td>
                  <td width="48%" style="background-color: #ffffff; border: 1px solid ${casitaSand}; border-radius: 4px; padding: 20px; vertical-align: top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Check-Out</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 600; color: ${casitaDark};">${formatDate(checkOut)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;">
                          <span style="color: ${casitaGray}; font-size: 13px;">Before ${checkOutTime}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Guests & Nights Summary -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid ${casitaSand}; border-radius: 4px;">
                <tr>
                  <td width="50%" style="padding: 16px 20px; border-right: 1px solid ${casitaSand}; text-align: center;">
                    <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Guests</span>
                    <br/>
                    <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: ${casitaDark};">${guestsCount}</span>
                  </td>
                  <td width="50%" style="padding: 16px 20px; text-align: center;">
                    <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Nights</span>
                    <br/>
                    <span style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: ${casitaDark};">${nightsCount}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Summary Section Header -->
          <tr>
            <td style="padding: 0 40px 16px 40px;">
              <h3 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 600; color: ${casitaDark}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid ${casitaOrange}; display: inline-block; padding-bottom: 4px;">
                Payment Summary
              </h3>
            </td>
          </tr>

          <!-- Price Breakdown -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${casitaSand}; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid ${casitaSand};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: ${casitaGray}; font-size: 14px;">Accommodation (${nightsCount} night${nightsCount > 1 ? 's' : ''})</td>
                        <td align="right" style="color: ${casitaDark}; font-size: 14px; font-weight: 500;">${formatCurrency(pricing.accommodation, pricing.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid ${casitaSand};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: ${casitaGray}; font-size: 14px;">Cleaning Fee</td>
                        <td align="right" style="color: ${casitaDark}; font-size: 14px; font-weight: 500;">${formatCurrency(pricing.cleaningFee, pricing.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${pricing.serviceFee ? `
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid ${casitaSand};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: ${casitaGray}; font-size: 14px;">Service Fee</td>
                        <td align="right" style="color: ${casitaDark}; font-size: 14px; font-weight: 500;">${formatCurrency(pricing.serviceFee, pricing.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid ${casitaSand};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: ${casitaGray}; font-size: 14px;">Taxes & Fees</td>
                        <td align="right" style="color: ${casitaDark}; font-size: 14px; font-weight: 500;">${formatCurrency(pricing.taxes, pricing.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: ${casitaCream};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: ${casitaDark}; font-size: 16px; font-weight: 600;">Total Charged</td>
                        <td align="right" style="font-family: 'Cormorant Garamond', Georgia, serif; color: ${casitaOrange}; font-size: 24px; font-weight: 700;">${formatCurrency(pricing.total, pricing.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Check-in Instructions - Always show -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; border-left: 3px solid ${casitaOrange}; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h4 style="margin: 0 0 16px 0; color: ${casitaDark}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Check-in Instructions</h4>
                    ${propertyType === 'hotel' ? `
                    <p style="margin: 0; color: ${casitaGray}; font-size: 14px; line-height: 1.8;">
                      <strong style="color: ${casitaDark};">Hotel Check-in:</strong> Simply present yourself at the front desk upon arrival. Please have your ID ready and mention the name on the reservation: <strong style="color: ${casitaOrange};">${guestName}</strong>.
                    </p>
                    ` : `
                    <p style="margin: 0; color: ${casitaGray}; font-size: 14px; line-height: 1.8;">
                      <strong style="color: ${casitaDark};">Self Check-in:</strong> On your check-in day, you will receive your access code via <strong>email</strong> and <strong>SMS</strong> to the phone number provided during booking. This will include the door code and any specific entry instructions for the property.
                    </p>
                    `}
                    ${specialInstructions ? `
                    <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid ${casitaSand}; color: ${casitaGray}; font-size: 14px; line-height: 1.7;">
                      <strong style="color: ${casitaDark};">Additional Notes:</strong> ${specialInstructions}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${hostName || hostPhone ? `
          <!-- Host Contact -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid ${casitaSand}; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <h4 style="margin: 0 0 8px 0; color: ${casitaDark}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Host</h4>
                    ${hostName ? `<p style="margin: 0; color: ${casitaGray}; font-size: 14px;">${hostName}</p>` : ''}
                    ${hostPhone ? `<p style="margin: 8px 0 0 0; color: ${casitaOrange}; font-size: 14px; font-weight: 500;">${hostPhone}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="https://hellocasita.com" style="display: inline-block; background-color: ${casitaOrange}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">View Your Reservation</a>
            </td>
          </tr>

          <!-- Decorative Divider -->
          <tr>
            <td style="padding: 0 60px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                  <td style="width: 80px; text-align: center; padding: 0 15px;">
                    <span style="color: ${casitaOrange}; font-size: 14px;">🌴 🏠 🌴</span>
                  </td>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #ffffff;">
              <p style="margin: 0 0 8px 0; color: ${casitaGray}; font-size: 14px;">Questions about your reservation?</p>
              <a href="mailto:${SUPPORT_EMAIL}" style="color: ${casitaOrange}; text-decoration: none; font-size: 14px; font-weight: 500;">${SUPPORT_EMAIL}</a>
              <p style="margin: 24px 0 0 0; color: #A3A3A3; font-size: 12px;">
                © ${new Date().getFullYear()} Casita · Your Home Away From Home
              </p>
              <p style="margin: 8px 0 0 0; color: #D4D4D4; font-size: 11px;">
                Santo Domingo · Punta Cana · San Juan · Caribbean
              </p>
            </td>
          </tr>

          <!-- Decorative Bottom Border -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${casitaOrange} 0%, ${casitaSand} 50%, ${casitaOrange} 100%);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Generate inquiry confirmation email HTML - Marriott-inspired elegant design
function generateInquiryConfirmationHTML(data: InquiryConfirmationData): string {
  const { guestName, propertyName, propertyImage, checkIn, checkOut, guestsCount, message } = data;

  // Casita brand colors
  const casitaOrange = '#E8A07A';
  const casitaCream = '#FDF8F5';
  const casitaSand = '#F4E4D4';
  const casitaGray = '#525252';
  const casitaDark = '#171717';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Received - Casita</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${casitaCream};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; overflow: hidden;">

          <!-- Decorative Top Border -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${casitaOrange} 0%, ${casitaSand} 50%, ${casitaOrange} 100%);"></td>
          </tr>

          <!-- Logo Header -->
          <tr>
            <td style="padding: 40px 40px 16px 40px; text-align: center; background-color: #ffffff;">
              <img src="https://casita-beapi.vercel.app/casita-logo.png" alt="Casita" style="height: 50px; width: auto;" />
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center; background-color: #ffffff;">
              <img src="https://hellocasita.com/icon-512.png" alt="" style="height: 60px; width: 60px;" />
            </td>
          </tr>

          <!-- Elegant Divider -->
          <tr>
            <td style="padding: 0 60px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                  <td style="width: 60px; text-align: center; padding: 0 15px;">
                    <span style="color: ${casitaOrange}; font-size: 18px;">🏠</span>
                  </td>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 32px 40px 16px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 32px; font-weight: 600; color: ${casitaDark}; letter-spacing: 1px;">
                Inquiry Received
              </h1>
              <p style="margin: 12px 0 0 0; color: ${casitaGray}; font-size: 15px;">
                We'll respond within 24 hours
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 40px;">
              <p style="margin: 0; color: ${casitaDark}; font-size: 16px; line-height: 1.7;">
                Dear ${guestName},
              </p>
              <p style="margin: 16px 0 0 0; color: ${casitaGray}; font-size: 15px; line-height: 1.7;">
                Thank you for your interest in <strong style="color: ${casitaDark};">${propertyName}</strong>. We have received your booking inquiry and our team is reviewing it now.
              </p>
            </td>
          </tr>

          <!-- Property Image -->
          ${propertyImage ? `
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <img src="${propertyImage}" alt="${propertyName}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">
            </td>
          </tr>
          ` : ''}

          <!-- Property Name Card -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 600; color: ${casitaDark};">
                      ${propertyName}
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Your Request Section -->
          <tr>
            <td style="padding: 0 40px 16px 40px;">
              <h3 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; font-weight: 600; color: ${casitaDark}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid ${casitaOrange}; display: inline-block; padding-bottom: 4px;">
                Your Request
              </h3>
            </td>
          </tr>

          <!-- Request Details -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${casitaSand}; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid ${casitaSand};">
                    <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Dates</span>
                    <br/>
                    <span style="color: ${casitaDark}; font-size: 15px; font-weight: 500; margin-top: 4px; display: inline-block;">
                      ${formatDate(checkIn)} → ${formatDate(checkOut)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; ${message ? `border-bottom: 1px solid ${casitaSand};` : ''}">
                    <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Guests</span>
                    <br/>
                    <span style="color: ${casitaDark}; font-size: 15px; font-weight: 500; margin-top: 4px; display: inline-block;">
                      ${guestsCount} guest${guestsCount > 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
                ${message ? `
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Message</span>
                    <br/>
                    <span style="color: ${casitaGray}; font-size: 14px; line-height: 1.6; margin-top: 4px; display: inline-block;">
                      "${message}"
                    </span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- What's Next -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; border-left: 3px solid ${casitaOrange}; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h4 style="margin: 0 0 16px 0; color: ${casitaDark}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">What Happens Next</h4>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: ${casitaOrange}; color: #fff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 12px;">1</span>
                        </td>
                        <td style="padding: 8px 0; color: ${casitaGray}; font-size: 14px; vertical-align: middle;">
                          Our team reviews your request
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: ${casitaOrange}; color: #fff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 12px;">2</span>
                        </td>
                        <td style="padding: 8px 0; color: ${casitaGray}; font-size: 14px; vertical-align: middle;">
                          You'll receive a response within 24 hours
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: ${casitaOrange}; color: #fff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; margin-right: 12px;">3</span>
                        </td>
                        <td style="padding: 8px 0; color: ${casitaGray}; font-size: 14px; vertical-align: middle;">
                          If approved, complete your booking securely
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="https://hellocasita.com/properties" style="display: inline-block; background-color: ${casitaOrange}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 4px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Explore More Properties</a>
            </td>
          </tr>

          <!-- Decorative Divider -->
          <tr>
            <td style="padding: 0 60px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                  <td style="width: 80px; text-align: center; padding: 0 15px;">
                    <span style="color: ${casitaOrange}; font-size: 14px;">🌴 🏠 🌴</span>
                  </td>
                  <td style="border-bottom: 1px solid ${casitaSand};"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #ffffff;">
              <p style="margin: 0 0 8px 0; color: ${casitaGray}; font-size: 14px;">Questions? We're here to help.</p>
              <a href="mailto:${SUPPORT_EMAIL}" style="color: ${casitaOrange}; text-decoration: none; font-size: 14px; font-weight: 500;">${SUPPORT_EMAIL}</a>
              <p style="margin: 24px 0 0 0; color: #A3A3A3; font-size: 12px;">
                © ${new Date().getFullYear()} Casita · Your Home Away From Home
              </p>
              <p style="margin: 8px 0 0 0; color: #D4D4D4; font-size: 11px;">
                Santo Domingo · Punta Cana · San Juan · Caribbean
              </p>
            </td>
          </tr>

          <!-- Decorative Bottom Border -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${casitaOrange} 0%, ${casitaSand} 50%, ${casitaOrange} 100%);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Send booking confirmation email
export async function sendBookingConfirmationEmail(data: BookingConfirmationData): Promise<{ success: boolean; error?: string }> {
  const html = generateBookingConfirmationHTML(data);
  const subject = `Booking Confirmed! Your stay at ${data.propertyName} - ${data.confirmationCode}`;
  return sendEmail(data.guestEmail, subject, html);
}

// Send inquiry confirmation email
export async function sendInquiryConfirmationEmail(data: InquiryConfirmationData): Promise<{ success: boolean; error?: string }> {
  const html = generateInquiryConfirmationHTML(data);
  const subject = `We received your inquiry for ${data.propertyName}`;
  return sendEmail(data.guestEmail, subject, html);
}

// Send notification to admin/host - Clean professional design
export async function sendHostNotificationEmail(data: {
  hostEmail: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  total: number;
  currency: string;
  confirmationCode: string;
  isInstantBooking: boolean;
}): Promise<{ success: boolean; error?: string }> {
  // Casita brand colors
  const casitaOrange = '#E8A07A';
  const casitaCream = '#FDF8F5';
  const casitaSand = '#F4E4D4';
  const casitaGray = '#525252';
  const casitaDark = '#171717';
  const successGreen = '#059669';

  const subject = `${data.isInstantBooking ? '✓ Confirmed' : '→ New Inquiry'}: ${data.propertyName} · ${formatDate(data.checkIn)}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${data.isInstantBooking ? 'Booking' : 'Inquiry'} - Casita</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${casitaCream};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; overflow: hidden;">

          <!-- Top Border -->
          <tr>
            <td style="height: 4px; background-color: ${data.isInstantBooking ? successGreen : casitaOrange};"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="https://casita-beapi.vercel.app/casita-logo.png" alt="Casita" style="height: 36px; width: auto;" />
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: ${data.isInstantBooking ? successGreen : casitaOrange}; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 4px;">
                      ${data.isInstantBooking ? '✓ Confirmed' : 'Inquiry'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: ${casitaDark};">
                ${data.isInstantBooking ? 'New Booking Received' : 'New Inquiry Received'}
              </h1>
              <p style="margin: 8px 0 0 0; color: ${casitaGray}; font-size: 14px;">
                ${data.isInstantBooking ? 'Payment has been processed successfully.' : 'Please respond within 24 hours.'}
              </p>
            </td>
          </tr>

          <!-- Confirmation Code -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; border-radius: 4px; width: 100%;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="color: ${casitaGray}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Confirmation</span>
                    <br/>
                    <span style="color: ${data.isInstantBooking ? successGreen : casitaOrange}; font-size: 20px; font-weight: 700; letter-spacing: 2px;">${data.confirmationCode}</span>
                  </td>
                  <td style="padding: 16px 20px; text-align: right;">
                    <span style="color: ${casitaGray}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Property</span>
                    <br/>
                    <span style="color: ${casitaDark}; font-size: 15px; font-weight: 600;">${data.propertyName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Guest & Stay Details -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${casitaSand}; border-radius: 4px;">
                <!-- Guest Info -->
                <tr>
                  <td colspan="2" style="padding: 16px 20px; border-bottom: 1px solid ${casitaSand}; background-color: ${casitaCream};">
                    <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Guest Information</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; width: 120px; color: ${casitaGray}; font-size: 14px;">Name</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaDark}; font-size: 14px; font-weight: 600;">${data.guestName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaGray}; font-size: 14px;">Email</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand};"><a href="mailto:${data.guestEmail}" style="color: ${casitaOrange}; text-decoration: none; font-size: 14px;">${data.guestEmail}</a></td>
                </tr>
                ${data.guestPhone ? `
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaGray}; font-size: 14px;">Phone</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaDark}; font-size: 14px;">${data.guestPhone}</td>
                </tr>
                ` : ''}

                <!-- Stay Info -->
                <tr>
                  <td colspan="2" style="padding: 16px 20px; border-bottom: 1px solid ${casitaSand}; background-color: ${casitaCream};">
                    <span style="color: ${casitaOrange}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Stay Details</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaGray}; font-size: 14px;">Check-in</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaDark}; font-size: 14px; font-weight: 500;">${formatDate(data.checkIn)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaGray}; font-size: 14px;">Check-out</td>
                  <td style="padding: 12px 20px; border-bottom: 1px solid ${casitaSand}; color: ${casitaDark}; font-size: 14px; font-weight: 500;">${formatDate(data.checkOut)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; ${data.isInstantBooking ? `border-bottom: 1px solid ${casitaSand};` : ''} color: ${casitaGray}; font-size: 14px;">Guests</td>
                  <td style="padding: 12px 20px; ${data.isInstantBooking ? `border-bottom: 1px solid ${casitaSand};` : ''} color: ${casitaDark}; font-size: 14px; font-weight: 500;">${data.guestsCount} guest${data.guestsCount > 1 ? 's' : ''}</td>
                </tr>
                ${data.isInstantBooking ? `
                <tr>
                  <td style="padding: 16px 20px; color: ${casitaGray}; font-size: 14px; font-weight: 600;">Total Paid</td>
                  <td style="padding: 16px 20px; color: ${successGreen}; font-size: 18px; font-weight: 700;">${formatCurrency(data.total, data.currency)}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Action Note -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${data.isInstantBooking ? '#ECFDF5' : casitaCream}; border-left: 3px solid ${data.isInstantBooking ? successGreen : casitaOrange}; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: ${casitaDark}; font-size: 14px; line-height: 1.6;">
                      ${data.isInstantBooking
                        ? '✓ This reservation is confirmed. The guest has received their confirmation email with booking details.'
                        : '→ Please review this inquiry in Guesty and respond to the guest within 24 hours.'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${casitaCream}; text-align: center;">
              <p style="margin: 0; color: #A3A3A3; font-size: 12px;">
                © ${new Date().getFullYear()} Casita · Host Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  return sendEmail(data.hostEmail, subject, html);
}

// ============================================
// 2FA VERIFICATION CODE EMAIL
// ============================================

type Locale = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'pl' | 'ar' | 'he' | 'zh' | 'ru';

interface TwoFAEmailData {
  email: string;
  code: string;
  name: string;
  language?: Locale;
}

// Translations for 2FA email
const twoFATranslations = {
  en: {
    subject: 'Your Casita Verification Code',
    title: 'Verification Code',
    greeting: (name: string) => `Hi ${name},`,
    intro: 'Use this code to access your Casita account:',
    expires: 'This code expires in 10 minutes.',
    warning: "If you didn't request this code, you can safely ignore this email.",
    footer: 'Your Home Away From Home',
  },
  es: {
    subject: 'Tu Codigo de Verificacion Casita',
    title: 'Codigo de Verificacion',
    greeting: (name: string) => `Hola ${name},`,
    intro: 'Usa este codigo para acceder a tu cuenta Casita:',
    expires: 'Este codigo expira en 10 minutos.',
    warning: 'Si no solicitaste este codigo, puedes ignorar este correo.',
    footer: 'Tu Hogar Lejos de Casa',
  },
  pt: {
    subject: 'Seu Codigo de Verificacao Casita',
    title: 'Codigo de Verificacao',
    greeting: (name: string) => `Ola ${name},`,
    intro: 'Use este codigo para acessar sua conta Casita:',
    expires: 'Este codigo expira em 10 minutos.',
    warning: 'Se voce nao solicitou este codigo, pode ignorar este email.',
    footer: 'Sua Casa Longe de Casa',
  },
  fr: {
    subject: 'Votre Code de Vérification Casita',
    title: 'Code de Vérification',
    greeting: (name: string) => `Bonjour ${name},`,
    intro: 'Utilisez ce code pour accéder à votre compte Casita :',
    expires: 'Ce code expire dans 10 minutes.',
    warning: 'Si vous n\'avez pas demandé ce code, vous pouvez ignorer cet email.',
    footer: 'Votre Maison Loin de Chez Vous',
  },
  de: {
    subject: 'Ihr Casita Verifizierungscode',
    title: 'Verifizierungscode',
    greeting: (name: string) => `Hallo ${name},`,
    intro: 'Verwenden Sie diesen Code, um auf Ihr Casita-Konto zuzugreifen:',
    expires: 'Dieser Code läuft in 10 Minuten ab.',
    warning: 'Wenn Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.',
    footer: 'Ihr Zuhause in der Ferne',
  },
  it: {
    subject: 'Il tuo Codice di Verifica Casita',
    title: 'Codice di Verifica',
    greeting: (name: string) => `Ciao ${name},`,
    intro: 'Usa questo codice per accedere al tuo account Casita:',
    expires: 'Questo codice scade tra 10 minuti.',
    warning: 'Se non hai richiesto questo codice, puoi ignorare questa email.',
    footer: 'La Tua Casa Lontano da Casa',
  },
  pl: {
    subject: 'Twój Kod Weryfikacyjny Casita',
    title: 'Kod Weryfikacyjny',
    greeting: (name: string) => `Cześć ${name},`,
    intro: 'Użyj tego kodu, aby uzyskać dostęp do swojego konta Casita:',
    expires: 'Ten kod wygasa za 10 minut.',
    warning: 'Jeśli nie prosiłeś o ten kod, możesz zignorować tę wiadomość.',
    footer: 'Twój Dom z Dala od Domu',
  },
  ar: {
    subject: 'رمز التحقق الخاص بك من Casita',
    title: 'رمز التحقق',
    greeting: (name: string) => `مرحباً ${name}،`,
    intro: 'استخدم هذا الرمز للوصول إلى حسابك في Casita:',
    expires: 'ينتهي صلاحية هذا الرمز خلال 10 دقائق.',
    warning: 'إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني.',
    footer: 'بيتك بعيداً عن البيت',
  },
  he: {
    subject: 'קוד האימות שלך מ-Casita',
    title: 'קוד אימות',
    greeting: (name: string) => `שלום ${name},`,
    intro: 'השתמש בקוד זה כדי לגשת לחשבון Casita שלך:',
    expires: 'קוד זה פג תוקף בעוד 10 דקות.',
    warning: 'אם לא ביקשת את הקוד הזה, אתה יכול להתעלם מאימייל זה.',
    footer: 'הבית שלך הרחק מהבית',
  },
  zh: {
    subject: '您的Casita验证码',
    title: '验证码',
    greeting: (name: string) => `您好 ${name}，`,
    intro: '使用此验证码访问您的Casita账户：',
    expires: '此验证码将在10分钟后过期。',
    warning: '如果您没有请求此验证码，请忽略此邮件。',
    footer: '您的家外之家',
  },
  ru: {
    subject: 'Ваш код подтверждения Casita',
    title: 'Код подтверждения',
    greeting: (name: string) => `Привет, ${name},`,
    intro: 'Используйте этот код для доступа к вашему аккаунту Casita:',
    expires: 'Этот код действителен 10 минут.',
    warning: 'Если вы не запрашивали этот код, просто проигнорируйте это письмо.',
    footer: 'Ваш дом вдали от дома',
  },
};

function generate2FAEmailHTML(data: TwoFAEmailData): string {
  const { code, name, language = 'en' } = data;
  const t = twoFATranslations[language];

  // Casita brand colors
  const casitaOrange = '#E8A07A';
  const casitaCream = '#FDF8F5';
  const casitaSand = '#F4E4D4';
  const casitaGray = '#525252';
  const casitaDark = '#171717';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title} - Casita</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${casitaCream};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; overflow: hidden;">

          <!-- Decorative Top Border -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${casitaOrange} 0%, ${casitaSand} 50%, ${casitaOrange} 100%);"></td>
          </tr>

          <!-- Logo Header -->
          <tr>
            <td style="padding: 40px 40px 16px 40px; text-align: center; background-color: #ffffff;">
              <img src="https://casita-beapi.vercel.app/casita-logo.png" alt="Casita" style="height: 45px; width: auto;" />
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center; background-color: #ffffff;">
              <img src="https://hellocasita.com/icon-512.png" alt="" style="height: 50px; width: 50px;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: ${casitaDark}; letter-spacing: 1px;">
                ${t.title}
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 16px 40px;">
              <p style="margin: 0; color: ${casitaDark}; font-size: 16px; line-height: 1.7;">
                ${t.greeting(name)}
              </p>
              <p style="margin: 12px 0 0 0; color: ${casitaGray}; font-size: 15px; line-height: 1.7;">
                ${t.intro}
              </p>
            </td>
          </tr>

          <!-- Verification Code Box -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: ${casitaCream}; border: 2px solid ${casitaOrange}; border-radius: 12px; padding: 24px; text-align: center;">
                    <span style="font-family: 'DM Sans', monospace; font-size: 40px; font-weight: 700; color: ${casitaOrange}; letter-spacing: 12px; display: block;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiration Notice -->
          <tr>
            <td style="padding: 0 40px 24px 40px; text-align: center;">
              <p style="margin: 0; color: ${casitaGray}; font-size: 14px;">
                ${t.expires}
              </p>
            </td>
          </tr>

          <!-- Security Warning -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${casitaCream}; border-left: 3px solid ${casitaSand}; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: ${casitaGray}; font-size: 13px; line-height: 1.6;">
                      ${t.warning}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #ffffff; border-top: 1px solid ${casitaSand};">
              <p style="margin: 0; color: #A3A3A3; font-size: 12px;">
                © ${new Date().getFullYear()} Casita · ${t.footer}
              </p>
            </td>
          </tr>

          <!-- Decorative Bottom Border -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${casitaOrange} 0%, ${casitaSand} 50%, ${casitaOrange} 100%);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Send 2FA verification code email
export async function send2FACodeEmail(data: TwoFAEmailData): Promise<{ success: boolean; error?: string }> {
  const t = twoFATranslations[data.language || 'en'];
  const html = generate2FAEmailHTML(data);
  return sendEmail(data.email, t.subject, html);
}
