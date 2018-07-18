window.addEventListener('load', () => {

	const
		helloTW = new TypeWriter({
			target: document.getElementById('helloThere'),
			text: 'Hello, there!',
			time: 10,
			audio: true,
			cursor: {
				activated: true
			}
		}),
		codeTW = new TypeWriter({
			target: document.getElementById('code'),
			text: `and I code in ${LANGUAGES[getNextLang()]}`,
			time: 10,
			audio: true
		}),
		navbar = document.querySelector('nav.navbar'),
		copyDate = document.getElementById('copyDate'),
		btnMute = document.getElementById('mute'),
		muteIcon = btnMute.querySelector('i.fa');

	
	navbar.style.opacity = '0';
	navbar.style.top = '-55px';
	document.body.style.overflow = 'hidden';

	// Typewriter animation
	TypeWriter.volume = 0.2;
	setTimeout(() => {
		document.body.classList.remove('load', 'spinner-3');

		setTimeout(() => {
			helloTW.type({
				callback: () => {
					helloTW.delete({
						delay: 1500,
						callback: () => {
							helloTW.setText('My name is Oussama Essamadi');
							helloTW.type({
								callback: () => {
									helloTW.setCursor();
									codeTW.setCursor();
									codeTW.type({
										callback: () => {
											setInterval(() => {
												codeTW.delete({
													chars: LANGUAGES[lang].length,
													callback: () => {
														codeTW.setText(`and I code in ${LANGUAGES[getNextLang()]}`);
														codeTW.type({
															start: codeTW.index + 1
														});
													}
												});
											}, 5000);

											navbar.style.transitionProperty = 'opacity top';
											navbar.style.transitionDuration = '0.8s';
											navbar.style.top = '0';
											navbar.style.opacity = '1';
											btnMute.style.display = 'block';
											document.body.style.overflowY = 'auto';
										}
									});
								}
							});
						}
					});
				}
			});
		}, 500);
	}, 1000);

	// CopyRight date
	var
		currYear = (new Date()).getFullYear(),
		initYear = 2018;
	
	if (currYear === initYear)
		copyDate.textContent = initYear;
	else
		copyDate.textContent = `${initYear} - ${currYear}`;

	// Mute button
	btnMute.addEventListener('click', () => {
		if (TypeWriter.volume == 0) {
			TypeWriter.volume = 0.2;
			muteIcon.classList.remove('fa-volume-off');
			muteIcon.classList.add('fa-volume-up');
		} else {
			TypeWriter.volume = 0;
			muteIcon.classList.remove('fa-volume-up');
			muteIcon.classList.add('fa-volume-off');
		}
	});	
});

const
	LANGUAGES = [
		'Bash',
		'BATCH',
		'C',
		'C++',
		'C#',
		'CSS',
		'Java',
		'Javascript',
		'HTML',
		'Lua',
		'Python',
		'PHP',
		'Pawn',
		'SQL',
		'Visual Basic'
	];

var
	lang = -1;

function getNextLang() {
	if(lang++ === LANGUAGES.length - 1)
		lang = 0;

	return lang;
}

function getPrevLang() {
	if(lang-- < 0)
		lang = LANGUAGES.length - 1;
	
	return lang;
}
