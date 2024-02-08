const btnNew0 = document.getElementById('new0');
const btnNew1 = document.getElementById('new1');
const btnNew2 = document.getElementById('new2');
const btnHint = document.getElementById('hint');
const ul = document.querySelector('ul');
const solutionWrapper = document.getElementById('solutionWrapper');
const solutionName = document.getElementById('solutionName');
const solutionDesc = document.getElementById('solutionDesc');
const btnSolution = document.getElementById('btnSolution');
const illustration = document.getElementById('illustration');

btnSolution.classList.add('hidden');
btnHint.classList.add('hidden');

let hintCount = 0;
let currentQuizz = {
    hints: [],
    solution: '',
};
let currentBlur = 50;

const setBlur = (blur) => {
    illustration.style.filter = `blur(${blur}px)`;
};

const revealHint = () => {
    ++hintCount;

    if (hintCount >= currentQuizz.hints.length) {
        btnSolution.classList.remove('hidden');
    } else {
        setBlur(currentBlur -= 5);
    }

    document.querySelector(`ul > li:nth-child(${hintCount})`)?.classList.remove('hidden');
};

btnHint.addEventListener('click', () => revealHint());
btnSolution.addEventListener('click', () => {
    solutionWrapper.classList.remove('hidden');
    btnSolution.classList.add('hidden');
    setBlur(0);
});

const run = async (level) => {
    btnNew0.setAttribute('disabled', 'true');
    btnNew1.setAttribute('disabled', 'true');
    btnNew2.setAttribute('disabled', 'true');
    solutionWrapper.classList.add('hidden');
    btnHint.classList.add('hidden');
    btnSolution.classList.add('hidden');

    ul.innerHTML = '';
    hintCount = 0;

    try {
        console.log(`get quiz "${level}"...`);

        const response = await fetch(`/new?level=${level}`, {
            method: 'post',
            headers: {
                'Accept-Content': 'application/json',
            },
        });

        console.log('response', response.ok);

        const { hints, solution, wikipediaSummary } = currentQuizz = await response.json();

        console.log({ hints, solution });

        hints.forEach(hint => {
            const li = document.createElement('li');

            li.classList.add('hidden', 'list-item');
            li.textContent = hint;

            ul.append(li);
        });

        solutionName.textContent = solution;
        solutionDesc.textContent = wikipediaSummary.extract;

        setBlur(50);
        illustration.setAttribute('src', wikipediaSummary.originalimage.source);

        revealHint();

        btnHint.classList.remove('hidden');
    } catch (e) {
        console.error(e);
    }

    btnNew0.removeAttribute('disabled');
    btnNew1.removeAttribute('disabled');
    btnNew2.removeAttribute('disabled');
};

btnNew0.addEventListener('click', () => run('Facile'));
btnNew1.addEventListener('click', () => run('Moyen'));
btnNew2.addEventListener('click', () => run('Difficile'));
