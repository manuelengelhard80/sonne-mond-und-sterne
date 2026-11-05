import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with apiKey from process.env.GEMINI_API_KEY
const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const FALLBACK_THOUGHTS: Record<string, string[]> = {
  Geborgenheit: [
    "Wie die Sterne leise wachen, musst du heute nichts beweisen. Du bist getragen, beschützt und geliebt.",
    "Nimm dir diesen Augenblick nur für dich. So wie Mond und Sonne ihren Platz am Himmel haben, hast du deinen eigenen, unersetzbaren Wert.",
    "Keine Eile, keine Erwartungen. Atme die Stille ein und spüre die Wärme, die dich umgibt."
  ],
  Ruhe: [
    "Lass die Gedanken wie sanfte Wolken vorbeiziehen. Die Welt darf für einen Moment stillstehen.",
    "Ein tiefer Atemzug verbindet dich mit dem Hier und Jetzt. Du musst heute nichts mehr erreichen.",
    "Der Mond wacht über die Stille der Nacht. Schenke auch dir selbst diese wohltuende Ruhe."
  ],
  Zuversicht: [
    "Jeder neue Tag bringt das sanfte Licht der Sonne zurück. Vertraue auf deinen ganz eigenen Rhythmus.",
    "Auch hinter den dichtesten Wolken leuchten die Sterne unverändert. Du bist stärker und strahlender als du ahnst.",
    "Gehe schrittweise voran, ganz in deinem Tempo. Die Sonne weicht ihrer Bahn niemals aus."
  ],
  Dankbarkeit: [
    "Danke für das Geschenk deines Daseins. Schön, dass es dich in diesem Universum gibt.",
    "Kleine Lichter füllen den Raum mit Freude. Schätze die leisen, magischen Momente dieses Tages.",
    "In der Begegnung von Tag und Nacht liegt das Wunder wahrhaftiger Liebe. Danke für deine Wärme."
  ]
};

export async function generatePoeticThought(mood: string, personalPrompt?: string): Promise<string> {
  if (!apiKey) {
    const list = FALLBACK_THOUGHTS[mood] || FALLBACK_THOUGHTS.Geborgenheit;
    return list[Math.floor(Math.random() * list.length)];
  }

  try {
    const systemInstruction = `Du bist die sanfte, wohlwollende Stimme der Poesie für eine geliebte Person ("meine Sonne"). 
Deine Sprache ist warm, entschleunigend, liebevoll und tiefgründig. 
Passend zum Thema "Sonne, Mond und Sterne" verfasst du kurze, wunderschöne Gedankenaufmunterungen auf Deutsch (2-4 Sätze). 
Keine Klischees, keine Aufgabenlisten, kein Druck. Nur pure Wärme, Trost und sanfte Inspiration.`;

    const userMsg = `Schreibe einen kurzen, warmen und tröstenden Impuls im Gefühl von "${mood}". ${
      personalPrompt ? `Persönlicher Wunsch: "${personalPrompt}"` : ''
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMsg,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 250,
      }
    });

    const text = response.text?.trim();
    if (text) return text;
    
    throw new Error('No text generated');
  } catch (err) {
    console.warn('Gemini API query unavailable, using fallback:', err);
    const list = FALLBACK_THOUGHTS[mood] || FALLBACK_THOUGHTS.Geborgenheit;
    return list[Math.floor(Math.random() * list.length)];
  }
}
