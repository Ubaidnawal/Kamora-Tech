const read = (value?: string) => value?.trim() ?? "";

const httpUrl = (value: string) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
};

const httpsUrl = (value: string) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
};

const whatsappUrl = () => {
  const raw = read(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  if (!raw) return "";

  const number = raw.replace(/[^\d]/g, "");
  if (number.length < 7 || number.length > 15) return "";

  return `https://wa.me/${number}`;
};

export const integrations = {
  authApiUrl: httpUrl(read(process.env.NEXT_PUBLIC_AUTH_API_URL)),
  forgotPasswordUrl: httpsUrl(read(process.env.NEXT_PUBLIC_FORGOT_PASSWORD_URL)),
  ordersApiUrl: httpUrl(read(process.env.NEXT_PUBLIC_ORDERS_API_URL)),
  whatsappUrl: whatsappUrl(),
  instagramUrl: httpsUrl(read(process.env.NEXT_PUBLIC_INSTAGRAM_URL)),
  facebookUrl: httpsUrl(read(process.env.NEXT_PUBLIC_FACEBOOK_URL)),
};
