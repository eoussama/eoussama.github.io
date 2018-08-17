'use strick';

const
	LANGUAGES = [
		{ lang: 'Bash', lvl: 46, color: '#c1f12e' },
		{ lang: 'BATCH', lvl: 30, color: '#c1f12e' },
		{ lang: 'C', lvl: 30, color: '#555555' },
		{ lang: 'C++', lvl: 44, color: '#f34b7d' },
		{ lang: 'C#', lvl: 83, color: '#178600' },
		{ lang: 'CSS', lvl: 85, color: '#563d7c' },
		{ lang: 'Java', lvl: 68, color: '#b07219' },
		{ lang: 'Javascript', lvl: 96, color: '#f1e05a' },
		{ lang: 'HTML', lvl: 100, color: '#e34c26' },
		{ lang: 'Lua', lvl: 56, color: '#000080' },
		{ lang: 'Pawn', lvl: 90, color: '#dbb284' },
		{ lang: 'PHP', lvl: 65, color: '#3572a5' },
		{ lang: 'Python', lvl: 35, color: '#3572a5' },
		{ lang: 'SQL', lvl: 76, color: '#dad8d8' },
		{ lang: 'Visual Basic', lvl: 70, color: '#945db7' }
    ],
    targetElement = document.querySelector('.skills-panel .grid');

function CreateSkillBoxes() {
        
    LANGUAGES.forEach((lang) => {
        let
            skillBox = document.createElement('div'),
            skillFlex = document.createElement('div'),
            flexSection = document.createElement('div'),
            h5 = document.createElement('h5'),
            progTrack = document.createElement('div'),
            progBar = document.createElement('div'),
            skillVal = document.createElement('div'),
            skillSpan = document.createElement('span');
        
        skillBox.classList.add('skill-box' ,'bg-light');
        skillFlex.classList.add('flex' ,'flex-gap-1' ,'flex-gap-skip');
        flexSection.classList.add('flex-section-3');
        progTrack.classList.add('progressTrack' ,'stripped' ,'animation' ,'bg-light-weak');
        progBar.classList.add('progressBar');
        skillVal.classList.add('skill-val' ,'flex-section-1');

        progBar.style.backgroundColor = h5.style.color = skillVal.style.backgroundColor = lang.color;
        h5.textContent = lang.lang;
        skillSpan.textContent = lang.lvl + '%';
        setProgressBar(progBar, lang.lvl);
        if(lang.lang === 'Lua')
            skillSpan.style.color = 'white';

        skillVal.appendChild(skillSpan);
        flexSection.appendChild(h5);
        flexSection.appendChild(progTrack);
        progTrack.appendChild(progBar);
        skillFlex.appendChild(flexSection);
        skillFlex.appendChild(skillVal);
        skillBox.appendChild(skillFlex);
        targetElement.appendChild(skillBox);
    });
}