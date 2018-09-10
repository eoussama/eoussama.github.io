'use strick';

const
	LANGUAGES = [
		{ lang: 'Bash', lvl: 46, color: '#c1f12e', exp: 2018, desc: 'System administration for both server and workspace management.' },
		{ lang: 'BATCH', lvl: 30, color: '#c1f12e', exp: 2017, desc: 'System administration for both server and workspace management.' },
		{ lang: 'C', lvl: 30, color: '#555555', exp: 2016,  desc: 'Simple to advanced console apps.' },
		{ lang: 'C++', lvl: 44, color: '#f34b7d', exp: 2016, desc: 'Simple to advanced console apps.' },
		{ lang: 'C#', lvl: 83, color: '#178600', exp: 2016, frameworks: ['.NET', 'ADO.NET', 'Entity Framework'], desc: 'High quality desktop applications (console/GUI).' },
		{ lang: 'CSS', lvl: 85, color: '#563d7c', exp: 2015, frameworks: ['Bootstrap', 'Materialize', 'FontAwesome', 'Bulma', 'Semantic UI'], desc: 'Taking full advantage of the native power of CSS.' },
		{ lang: 'Java', lvl: 68, color: '#b07219', exp: 2017, frameworks: ['Java FX'], desc: 'Making desktop and Android applications.' },
		{ lang: 'Javascript', lvl: 96, color: '#f1e05a', exp: 2017, frameworks: ['Express', 'Paper.js', 'jQuery', 'AOS'], desc: 'Sofisticated front-end and back-end (Node.js) websites.' },
		{ lang: 'HTML', lvl: 100, color: '#e34c26', exp: 2015, desc: 'Building semantic webpages.' },
		{ lang: 'Lua', lvl: 56, color: '#000080', exp: 2018, frameworks: ['Love2D'], desc: 'Mini-games based on the Love2D framework.' },
		{ lang: 'Pawn', lvl: 90, color: '#dbb284', exp: 2015, desc: 'Creating modern gamemodes/filterscripts/includes for GTA SA-MP.' },
		{ lang: 'PHP', lvl: 65, color: '#3572a5', exp: 2017, desc: 'Making back-end websites' },
		{ lang: 'Python', lvl: 35, color: '#3572a5', exp: 2017, frameworks: ['Flask'], desc: 'Making console desktop apps and back-end websites.' },
		{ lang: 'SQL', lvl: 76, color: '#dad8d8', exp: 2017, desc: 'Familiar with many database management systems such as; MySQL, SQLServer, SQLite...' },
		{ lang: 'Visual Basic', lvl: 70, color: '#945db7', exp: 2017, frameworks: ['.NET', 'ADO.NET'], desc: 'Fully functional (console/GUI) desktop applications.' }
    ],
    targetElement = document.querySelector('.skills-panel .grid');

function CreateSkillBoxes() {
    const skillInfoPanel = document.getElementById('skill-info');

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

        skillBox.dataset.prog = lang.lvl;
        progBar.style.backgroundColor = h5.style.color = skillVal.style.backgroundColor = lang.color;
        h5.textContent = lang.lang;
        skillSpan.textContent = lang.lvl + '%';
        setProgressBar(progBar, lang.lvl);
        if(lang.lang === 'Lua')
            skillSpan.style.color = 'white';

        skillBox.addEventListener('mouseenter', () => {
            const
                __posX = (targetElement.offsetLeft + skillBox.offsetLeft) + 'px',
                __posY = (targetElement.offsetTop + skillBox.offsetTop + skillBox.offsetHeight) + 'px',
                __width = skillBox.offsetWidth + 'px';
            
            skillInfoPanel.style.left = __posX;
            skillInfoPanel.style.top = __posY;
            skillInfoPanel.style.width = __width;

            skillInfoPanel.querySelector('p').textContent = lang.desc;
            skillInfoPanel.querySelector('span.skill-info-lvl-per').textContent = lang.lvl + '%';
            skillInfoPanel.querySelector('span.skill-info-lvl-name').textContent = (function () {
                if(lang.lvl >= 0 && lang.lvl < 25) return 'Weak';
                else if(lang.lvl >= 25 && lang.lvl < 50) return 'Beginner';
                else if(lang.lvl >= 50 && lang.lvl < 75) return 'Familiar';
                else if(lang.lvl >= 75 && lang.lvl < 100) return 'Advanced';
                else return 'Expert';
            }());
            skillInfoPanel.querySelector('span.skill-info-lvl-exp').textContent = `${((new Date()).getFullYear() - lang.exp + 1)} year${((new Date()).getFullYear() - lang.exp + 1) > 1 ? 's' : ''}`;
            if(lang.frameworks) {
                const __fmContainer = skillInfoPanel.querySelector('div.skill-info-frameworks-fms');

                __fmContainer.innerHTML = '';
                lang.frameworks.forEach(__fm => {
                    let __fmCig = document.createElement('span');

                    __fmCig.classList.add('cig', 'dark', 'invert', 'text-center');
                    __fmCig.textContent = __fm;
                    __fmContainer.appendChild(__fmCig);
                    
                });
                skillInfoPanel.querySelector('div.skill-info-frameworks').style.display = 'grid';
                skillInfoPanel.querySelector('hr:last-of-type').style.display = 'block';
            } else {
                skillInfoPanel.querySelector('div.skill-info-frameworks').style.display = 'none';
                skillInfoPanel.querySelector('hr:last-of-type').style.display = 'none';
            }
            
            skillInfoPanel.style.display = 'block';
        });

        skillBox.addEventListener('mouseleave', () => {
            skillInfoPanel.style.display = 'none';
        });

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