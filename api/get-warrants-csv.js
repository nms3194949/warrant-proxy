// --- Vercel 專用版 api/get-warrants-csv.js ---
// 【MOMO 修正】 新增對 'OPTIONS' 請求的處理

import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import iconv from 'iconv-lite';

export default async function handler(req, res) {

    // --- 【關鍵修正】 ---
    // Vercel 的 vercel.json 會自動加上 CORS 標頭，
    // 但我們必須手動處理 'OPTIONS' 預檢請求，
    // 讓它回傳 200 OK，而不是 405。
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // --- 【修正結束】 ---

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