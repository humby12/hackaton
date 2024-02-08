const express = require('express');
const { OpenAI } = require('openai');
const { inspect } = require('util');
const wiki = require('wikipedia');
const csv = require('csv-parse');
const fs = require('fs');
const cheerio = require('cheerio');


const app = express();
const PORT = 3000;


const log = x => console.log(inspect(x, {
    colors: true,
    depth: 20,
}));



const sportifs = [];

fs.createReadStream('./Sportifs_clean2.csv')
    .pipe(csv.parse({ delimiter: ';' }))
    .on('data', (data) => sportifs.push({
        level: data[0],
        name: data[1],
        link: data[2],
    }))
    .on('end', () => {
        if (sportifs[0].name === 'LIBELLE') {
            sportifs.shift();
        }

        console.log(sportifs.slice(0, 3));
        console.log(`${sportifs.length} sportifs loaded`);
    })
;

const { random, floor } = Math;
const getRandomSportif = (level) => {
    const levelSportifs = sportifs.filter(s => s.level === level);
    console.log(level + ': ' + levelSportifs.length);
    return levelSportifs[floor(random() * levelSportifs.length)];
};


const openai = new OpenAI({
    apiKey: '',
});


app.use(express.static('.'));


app.post('/new', async (req, res) => {
    try {
        console.log('=================================');
        console.log('============== NEW ==============');
        console.log('=================================');

        const { level } = req.query;

        console.log('get random sportif ' + level);

        const sportif = getRandomSportif(level);

        console.log({ sportif });

        console.log(`searching ${sportif.name}...`);

        await wiki.setLang('fr');
        const searchResults = await wiki.search(sportif.name + ' (sport)');

        console.log(searchResults);

        const searchResult = searchResults.results.shift();

        console.log(`searching ${searchResult.title}...`);

        const wikipediaContent = await wiki.content(searchResult.title);
        const wikipediaSummary = await wiki.summary(searchResult.title);

        console.log({ wikipediaSummary });

        console.log(wikipediaContent.substring(0, 200));

        // console.log('done, crawl lequipe.fr...');

        // const lequipeResponse = await fetch(sportif.link);
        // const fiche = cheerio.load(await lequipeResponse.text());

        // console.log(fiche('section.visuel img')[0].attributes.find(a => a.name === 'src').value);
        // return;

        console.log('done. Sending AI prompt...');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: wikipediaContent,
                },
                {
                    role: 'user',

                    //content: `fais moi deviner qui c'est en me donnant une liste d'une dizaine d'indices qui ne doivent absolument ne pas dépasser 3 mots chacun.`,

                    content: `Ton objectif est donc de me fournir, pour cet athlète précis, 5 indices (qui doivent pas dépasser une douzaine de mots) qui donneront de plus en plus d'aide à l'utilisateur pour retrouver l'athlète :
                    - Le premier indice doit fournir des indications précises (ex : date de naissance / lieu de naissance) mais qui ne suffisent pas pour deviner l'athlète si on ne le connait pas de manière détaillée
                    - Le deuxième indice doit absolument avoir un lien avec les jeux Olympiques (comme ses participations, ses médailles...)
                    - Le troisième indice doit permettre d'obtenir une info plus personnelle sur sa vie (ex : on le surnommait X / il est devenu consultant après sa carrière / elle est connue pour s'être engagé pour telle cause etc...)
                    - Le quatrième indice doit être l'élément le plus marquant de sa carrière ( (ex : il a brillé dans telle Olympiade / elle a été x fois médaillé / il a été capitaine de son équipe / sélectionné x fois etc...)
                    - Enfin le dernier indice doit permettre de donner les informations les plus importantes de l'athlète : nationalité / sport`,
                },
            ],
        });

        log(completion);
        const { content } = completion.choices[0].message;

        const hints = content.match(/^\d+\. (.+)$/gm);

        console.log('Response payload', {
            hints,
            solution: sportif.name,
        });

        res.send({
            hints,
            solution: sportif.name,
            wikipediaSummary,
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});