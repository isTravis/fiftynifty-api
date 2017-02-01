import CryptoJS from 'crypto-js';

export function encryptPhone(phone) {	
	const secret = process.env.PHONE_KEY;
	const salt = CryptoJS.enc.Base64.parse(process.env.PHONE_SALT);
	const iv = CryptoJS.enc.Base64.parse(process.env.PHONE_IV);


	return CryptoJS.AES.encrypt(phone, secret, { salt: salt, iv: iv }).toString();
}

export function decryptPhone(cipherText) {	
	const secret = process.env.PHONE_KEY;
	const salt = CryptoJS.enc.Base64.parse(process.env.PHONE_SALT);
	const iv = CryptoJS.enc.Base64.parse(process.env.PHONE_IV);

	return CryptoJS.AES.decrypt(cipherText, secret, { salt: salt, iv: iv }).toString(CryptoJS.enc.Utf8);
}
