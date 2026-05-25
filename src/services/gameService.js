const API_URL = "http://localhost:8000/api";
//const API_URL = "https://lifecurve.andrewphillips.online/api/v1";

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    return response.json();
}

export async function createGameApi(data) {
    try {
        return await requestJson(`${API_URL}/create-game.php`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error("Create Game Error:", error);

        return {
            success: false,
            error: error.message,
        };
    }
}

export async function saveGameApi(snapshot) {
    try {
        return await requestJson(`${API_URL}/save-game.php`, {
            method: "POST",
            body: JSON.stringify(snapshot),
        });
    } catch (error) {
        console.error("Save Game Error:", error);

        return {
            success: false,
            error: error.message,
        };
    }
}

export async function loadGameApi(publicCode) {
    try {
        const url = `${API_URL}/load-game.php?public_code=${encodeURIComponent(publicCode)}`;

        return await requestJson(url);
    } catch (error) {
        console.error("Load Game Error:", error);

        return {
            success: false,
            error: error.message,
        };
    }
}