import axios from 'axios';
(async () => {
  try {
    // We don't have the token, but let's see if we get 401 or a validation error (400)
    // Actually, let's login first to get a token.
    const loginRes = await axios.post('http://192.168.0.161:3000/api/v1/auth/login', {
      email: 'admin@shoukhinabesh.com', // Let's guess the email or we just post without token and see
      password: 'password'
    });
    const token = loginRes.data.data.accessToken || loginRes.data.data.token;
    
    const res = await axios.post('http://192.168.0.161:3000/api/v1/categories', {
      name: 'Test Category',
      slug: 'test-category',
      imageUrl: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCCESS:', res.data);
  } catch (e) {
    if (e.response) {
      console.log('ERROR STATUS:', e.response.status);
      console.log('ERROR DATA:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.log('ERROR:', e.message);
    }
  }
})();
