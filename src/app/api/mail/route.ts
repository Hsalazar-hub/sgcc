import {Resend} from "resend"


const resend = new Resend("re_Xeq6c2mE_14iuFx8Tt4NqnEHZDKj75XCX")

export async function GET(request: Request) {
 const {data, error} = await resend.emails.send({
  to: "hdsalazar20@gmail.com", 
  from: "Acme <onboarding@resend.dev>",
  subject: "Tu póliza está a punto de expirar",
 // react: undefined,
 html: `<p>Su póliza <strong>Toribio</strong> está a punto de expirar, por favor esté atento!</p>`,
 }) 
 if (error) {
  return console.error({ error });
}
  return Response.json({ ok: true });
}
