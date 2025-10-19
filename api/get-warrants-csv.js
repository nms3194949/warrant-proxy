// --- Vercel 專用版 api/get-warrants-csv.js ---
// (已移除所有手動 CORS 設定，改用 vercel.json)

const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const iconv = require('iconv-lite');

export default async function handler(req, res) {
    
    // 只允許 GET 請求
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
            throw new Error(`Yuanta Server Error: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const csvData = iconv.decode(Buffer.from(buffer), 'big5');
        
        // 直接回傳資料
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(csvData);

    } catch (error) {
        console.error(error);
        res.status(500).send(`Error fetching data from Yuanta: ${error.message}`);
    }
}