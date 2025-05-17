const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = "https://api.github.com/repos/LeafGaming1/bot-unban/contents/unbanned_users.json";

async function fetchList() {
    const resp = await axios.get(GITHUB_API_URL, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const content = resp.data.content;
    const sha = resp.data.sha;
    const users = JSON.parse(Buffer.from(content, 'base64').toString());
    return { users, sha };
}

async function updateList(users, sha, message) {
    const updatedContent = Buffer.from(JSON.stringify(users, null, 2)).toString('base64');
    await axios.put(GITHUB_API_URL, {
        message: message,
        content: updatedContent,
        sha: sha
    }, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
}

app.get('/api/unbanned_users', async (req, res) => {
    try {
        const { users } = await fetchList();
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/remove_unbanned_user', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    try {
        const { users, sha } = await fetchList();
        const newUsers = users.filter(u => u !== userId);
        await updateList(newUsers, sha, `Remove ${userId} from unbanned_users.json via API`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(3000, () => console.log("API running on port 3000"));
