export interface SendSmsParams { phone:string; code:string }
export async function sendSms(params:SendSmsParams):Promise<void>{ if(process.env.NODE_ENV !== 'production' || !process.env.SMS_API_KEY){ console.log(`📱 [DEV MODE] SMS-код для ${params.phone}: ${params.code}`); return; } /* Provider adapter: configure SMS_API_KEY and replace transport. */ }
