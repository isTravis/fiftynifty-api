import { User } from '../models';
import { encryptPhone, decryptPhone } from '../utilities/encryption';

User.count({
})
.then(function(count) {
	let id = 1;
	for (id = 1; id <= count; id++) {
		console.log(id);
		User.findById(id, {
			attributes: ['id', 'phone'],
		})
		.then(function(user) {
			const realPhone = decryptPhone(user.dataValues.phone);
			const realPhoneEncrypted = encryptPhone(realPhone);
			User.update(
				{ phone: realPhoneEncrypted },
				{	
					where: {
						phone: user.dataValues.phone,
					}
				},
			)
			.then(function(result) {
				console.log("Success " + result);
			})
			.catch(function(err) {
				console.log(err);
			});
		})
		.catch(function(err) {
			console.log(err);
		});
	}
});
