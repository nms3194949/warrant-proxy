// --- Vercel 專用版 api/get-warrants-csv.js ---
// (已包含 CORS 跨域設定)

const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const iconv = require('iconv-lite');

export default async function handler(req, res) {
    
    // --- 【關鍵的 CORS 設定】 ---
    // 告訴瀏覽器，我們允許來自您 GitHub 網站的請求
    res.setHeader('Access-Control-Allow-Origin', 'https://nms3194949.github.io');
    // 允許 GET 請求
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    // 允許的標頭
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Vercel 會自動處理 OPTIONS 預檢請求 (Preflight request)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // --- 【CORS 設定結束】 ---


    if (req.method !== 'GET') {
        return res.status(405).send({ message: 'Only GET requests allowed' });
    }

    try {
        const payloadObject = {
            format: "CSV",
            factor: {
                columns: [
                    "FLD_WAR_ID", "FLD_WAR_NM", "FLD_WAR_TXN_PRICE", "FLD_WAR_UP_DN",
                    "FLD_WAR_UP_DN_RATE", "FLD_WAR_TXN_VOLUME", "FLD_N_STRIKE_PRC",
                    "FLD_N_UND_CONVER", "FLD_PERIOD", "FLD_IN_OUT", "FLD_BUY_SELL_RATE",
                    "FLD_LEVERAGE", "FLD_IV_CLOSE_PRICE", "FLD_OUT_VOL_RATE"
                ],
                condition: [
                    { field: "FLD_WAR_TYPE", values: ["1", "2"] },
                    { field: "FLD_ISSUE_AGT_ID", values: ["980"] }
                ]
            },
            pagination: { page: "1" }
        };
        const params = new URLSearchParams();
        params.append('data', JSON.stringify(payloadObject));

        const response = await fetch('https://www.warrantwin.com.tw/eyuanta/ws/GetWarData.ashx', {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Referer': 'https://www.warrantwin.com.tw/eyuanta/Warrant/Search.aspx'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const csvData = iconv.decode(Buffer.from(buffer), 'big5');
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(csvData);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data from Yuanta');
    }
}