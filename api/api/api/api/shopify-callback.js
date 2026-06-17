export default function handler(req,res){res.status(200).send("Shopify returned to ProfitsPilot. Next step: verify HMAC, exchange code for an access token, then save the connection in Supabase.");}
