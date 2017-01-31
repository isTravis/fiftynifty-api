import app from '../../server';

export function logout(req, res) {
	req.logout();
	res.status(201).json(true);
}
app.get('/logout', logout);
