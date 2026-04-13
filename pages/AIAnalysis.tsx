import React, { useState } from 'react';
import { useERP } from '../contexts/ERPContext';
import { UserRole } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, Send } from 'lucide-react';

const AIAnalysis = () => {
  const { currentUser, transactions, stocks, products } = useERP();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // We mock the API call here as we can't reliably inject a real key in a demo
  // In a real scenario, this would use process.env.API_KEY
  const handleAskAI = async () => {
    if (!prompt) return;
    setLoading(true);
    
    try {
        // Construct context from current ERP state
        const salesSummary = transactions
            .filter(t => t.type === 'INCOME')
            .slice(-20)
            .map(t => `${t.date.split('T')[0]}: $${t.amount} (${t.category})`)
            .join('\n');
        
        const stockSummary = stocks
            .map(s => {
                const p = products.find(prod => prod.id === s.productId);
                return `${p?.name}: ${s.quantity}`;
            })
            .join(', ');

        const systemInstruction = `
            You are an expert ERP analyst for Sun Cola Pvt. 
            Analyze the following data:
            Recent Sales: ${salesSummary}
            Current Stocks: ${stockSummary}
            
            User Question: ${prompt}
            
            Provide a concise, strategic insight or answer.
        `;

        // Check if API key exists (simulated environment check)
        if (process.env.API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const result = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: systemInstruction,
            });
            setResponse(result.text || "No insights generated.");
        } else {
            // Fallback for demo without key
            await new Promise(r => setTimeout(r, 1500));
            setResponse(`(Demo Mode - API Key missing) Based on your data, Sun Cola sales are trending upwards. Recommend restocking "Sun Cola 1.5L" in North Hub as quantities are below 500 units. Consider a promotion for Lemon flavor to boost sales velocity.`);
        }
    } catch (error) {
        setResponse("Error connecting to AI service. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  if (currentUser?.role !== UserRole.SUPER_ADMIN) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center mb-4">
                <Sparkles className="h-8 w-8 mr-3 text-yellow-300" />
                <h1 className="text-3xl font-bold">Smart Insights AI</h1>
            </div>
            <p className="text-indigo-100 text-lg">
                Ask deeper questions about your sales trends, stock prediction, or financial health.
            </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex gap-4">
                <input 
                    type="text" 
                    className="flex-1 p-4 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                    placeholder="e.g., 'Analyze sales trends for this week' or 'Which product needs restocking?'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                />
                <button 
                    onClick={handleAskAI}
                    disabled={loading || !prompt}
                    className="px-8 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold flex items-center"
                >
                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
                </button>
            </div>

            {response && (
                <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in">
                    <h3 className="text-indigo-900 font-bold mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Analysis Result
                    </h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{response}</p>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-500">
            <div className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
                 onClick={() => setPrompt("What is our best selling product?")}>
                "What is our best selling product?"
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
                 onClick={() => setPrompt("Draft a restocking plan for North Hub")}>
                "Draft a restocking plan for North Hub"
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
                 onClick={() => setPrompt("Analyze profit margins for current month")}>
                "Analyze profit margins"
            </div>
        </div>
    </div>
  );
};

export default AIAnalysis;
