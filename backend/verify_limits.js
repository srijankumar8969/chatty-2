
const makeRequest = async (i) => {
    try {
        const response = await fetch("http://localhost:5001/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com", password: "wrongpassword" }),
        });
        console.log(`Request ${i}: Status ${response.status}`);
    } catch (error) {
        console.log(`Request ${i}: Error ${error.message}`);
    }
};

const run = async () => {
    console.log("Testing Rate Limiting (Limit: 5 requests)...");
    for (let i = 1; i <= 7; i++) {
        await makeRequest(i);
    }
};

run();
