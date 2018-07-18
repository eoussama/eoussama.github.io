window.addEventListener('load', () => {
	const
		helloTW = new TypeWriter({
			target: document.getElementById('helloThere'),
			text: 'Hello, there!',
			time: 120,
			audio: true,
			cursor: {
				activated: true
			}
		}),
		codeTW = new TypeWriter({
			target: document.getElementById('code'),
			text: `and I code in ${LANGUAGES[getNextLang()]}`,
			time: 120,
			audio: true
		});

	TypeWriter.volume = 0.2;
	document.body.style.opacity = '0';
	setTimeout(() => {
		document.body.style.opacity = '1';
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
