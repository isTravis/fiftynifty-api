import { zips } from './zips';
const firstNames = ['Pearly', 'Wilmer', 'Carlie', 'Karie', 'Tyrone', 'Jesusita', 'Hosea', 'Peg', 'Kimberlee', 'Casie', 'Darwin', 'Stacie', 'Hyman', 'Abraham', 'Donna', 'Clarine', 'Josh', 'Dagmar', 'Afton', 'Tamra', 'Tamica', 'Lorie', 'Nicol', 'Raymond', 'Karleen', 'Merilyn', 'Herma', 'Gail', 'Cleta', 'Leora', 'Cheree', 'Juliana', 'Katherina', 'Luigi', 'Eleonor', 'Zofia', 'Danna', 'Giuseppina', 'Dusti', 'Byron', 'Sybil', 'Latashia', 'Loren', 'Sixta', 'Neal', 'Hortencia', 'Elliot', 'Arvilla', 'Charis', 'Ignacio', 'Mireille', 'Onie', 'Jonelle', 'Linnie', 'Venus', 'Bryan', 'Angle', 'Yasmine', 'Terisa', 'Heath', 'Jacinta', 'Dave', 'Myrtle', 'Iraida', 'Vilma', 'Orlando', 'Myra', 'Teresa', 'Hank', 'Paola', 'Cami', 'Ed', 'Dianne', 'Jodee', 'Leonel', 'Sherly', 'Nickie', 'Odelia', 'Janean', 'Usha', 'Flavia', 'Darci', 'Joyce', 'Bert', 'Colin', 'Rea', 'Zaida', 'Domonique', 'Lavina', 'Ha', 'Georgette', 'Harmony', 'Lorrie', 'Martin', 'Joe', 'Julie', 'Shaun', 'Rena', 'Bo', 'Betty', 'Henrietta', 'Chi', 'Oralia', 'Jessia', 'Iola', 'Tish', 'Liz', 'Marilyn', 'Oliva', 'Rona', 'Alana', 'Alethia', 'Eugenia', 'Casandra', 'Epifania', 'Adrien', 'Soo', 'Norris', 'Carola', 'Remedios', 'Alejandro', 'Darwin', 'Steve', 'Rachel', 'Sheena', 'Jona', 'Alison', 'Alfredia', 'Hilton', 'Leta', 'Lory', 'Kelly', 'Pearle', 'Ezekiel', 'Carmelia', 'Keitha', 'Vilma', 'Herlinda', 'Lucien', 'Ambrose', 'Debi', 'Josie', 'Wilton', 'Doug', 'Libbie', 'Argentina', 'Kera', 'Oren', 'Lelah', 'Johnny', 'Rema', 'Renna', 'Ji', 'Harrison', 'Renata', 'Kennith', 'Shanell', 'Dann', 'Ciara', 'Sueann', 'Jenice', 'Arnetta', 'Simona', 'Lura', 'Lakenya', 'Carlie', 'Dario', 'Sarah', 'Sonia', 'Kenda', 'Benedict', 'Shiloh', 'Klara', 'Ayako', 'Margret', 'Raina', 'Oren', 'Delmy', 'Alyce', 'Cliff', 'Dodie', 'Piper', 'Chloe', 'Stefanie', 'Twanda', 'Boris', 'Deann', 'Karlyn', 'Patrick', 'Rosette', 'Barbara', 'Angela', 'Doretta', 'Julianne', 'Tabatha', 'Yetta', 'Tanna', 'Orville', 'Season', 'Dian'];
const lastNames = ['Raimondi', 'Griffen', 'Nolte', 'Zeno', 'Sheen', 'Weatherholtz', 'Rapozo', 'Alexis', 'Elza', 'Grasty', 'Blick', 'Hirsch', 'Welsh', 'Bibby', 'Rieger', 'In', 'Snelling', 'Wisniewski', 'Laguerre', 'Shanley', 'Sato', 'Lowrance', 'Seiter', 'Fujiwara', 'Mullane', 'Kolman', 'Normandeau', 'Clardy', 'Dahlman', 'Norfleet', 'Mangus', 'Waites', 'Selvey', 'Keyes', 'Spencer', 'Mey', 'Masten', 'Shurtliff', 'Mero', 'Cumbie', 'Koehn', 'Mullett', 'Nunemaker', 'Sessler', 'Basye', 'Timko', 'Infante', 'Nedeau', 'Angelos', 'Whitacre', 'Barbara', 'Nickels', 'Tarrant', 'Rodden', 'Wiedeman', 'Newlin', 'Penley', 'Falcone', 'Piotrowski', 'Mcelyea', 'Byam', 'Applin', 'Culberson', 'Carabajal', 'Royer', 'Rosenbloom', 'Reade', 'Ronning', 'Burghart', 'Seelig', 'Munyon', 'Rosebrook', 'Ehlers', 'Schur', 'Campas', 'Dandridge', 'Dicicco', 'Anton', 'Aikens', 'Yule', 'Hulin', 'Marcinkowski', 'Patin', 'Raftery', 'Loiacono', 'Laurich', 'Novick', 'Collman', 'Duhn', 'Manning', 'Press', 'Saraiva', 'Flemister', 'Morton', 'Storch', 'Loudin', 'Keebler', 'Blouin', 'Lenox', 'Stormer', 'Oliveri', 'Ku', 'Craycraft', 'Ogden', 'Shum', 'See', 'Petway', 'Trombetta', 'Nault', 'Plasencia', 'Bynoe', 'Kifer', 'Hutchcraft', 'Garoutte', 'Mccreary', 'Maron', 'Addie', 'Edmondson', 'Hullinger', 'Mckie', 'Fenimore', 'Carino', 'Yetter', 'Ellard', 'Whidbee', 'Toki', 'Meneely', 'Roemer', 'Gephart', 'Kile', 'Bolding', 'Matis', 'Womer', 'Polizzi', 'Yule', 'Setliff', 'Stolle', 'Goudreau', 'Burrowes', 'Greely', 'Foster', 'Hansel', 'Marchan', 'Specht', 'Glazer', 'Coplan', 'Dunning', 'Dickinson', 'Ramerez', 'Holtkamp', 'Milani', 'Eddington', 'Vega', 'Batie', 'Schmeling', 'Spitzer', 'Dakin', 'Appell', 'Beckert', 'Yepez', 'Miele', 'Epp', 'Huskey', 'Hannah', 'Swihart', 'Summerall', 'Chadwick', 'Ruge', 'Gangestad', 'Killebrew', 'Huskins', 'Dardar', 'Angeles', 'Shane', 'Levasseur', 'Gehling', 'Ehrenberg', 'Wojtczak', 'Lund', 'Grady', 'Bridge', 'Kaiser', 'Silvester', 'Corning', 'Wayne', 'Paez', 'Numbers', 'Vinzant', 'Dunphy', 'Osier', 'Sotomayor', 'Cedillo', 'Dillingham', 'Harju', 'Epstein', 'Tiernan', 'Britten', 'Najar', 'Nickel', 'Khalsa'];
import { encryptPhone } from '../utilities/encryption';

export function generateUsers(length, count) {
	const users = [];
	for (let index = count; index < length + count; index++) {
		const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
		const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
		const zipObject = zips[Math.floor(Math.random() * zips.length)]
		const zipcode = zipObject.zip;
		const state = zipObject.state;
		const chanceOfParent = 0.8;
		const parent = index > 0 && Math.random() < chanceOfParent ? Math.ceil(Math.random() * index) : null;

		users.push({
			name: firstName + ' ' + lastName,
			zipcode: zipcode,
			phone: encryptPhone('+' + (10000000000 + index)),
			parentId: parent,
			state: state,
			district: Math.ceil(Math.random() * 8),
			signupCompleted: true,
		});
	}
	return users;
}

export function generateCalls(users) {
	const zipToState = {};
	zips.forEach((item)=> {
		zipToState[item.zip] = item.state;
	});

	// Generate an array of calls for each user.
	const maxNumCalls = 3;
	const userCalls = users.map((user)=> {
		const numCalls = Math.round(Math.random() * maxNumCalls);
		const calls = Array.from(Array(numCalls));
		return calls.map((call)=> {
			return {
				numberDialed: '+15555555555',
				zip: user.zipcode,
				state: zipToState[user.zipcode],
				duration: Math.ceil(Math.random() * 240),
				callerId: user.id,	
			};
		});
	});

	// Merge the array of arrays to a single array that can be bulk inserted
	// [[item1], [item2, item3], [item4]] -> [item1, item2, item3, item4]
	return [].concat.apply([], userCalls);
}
