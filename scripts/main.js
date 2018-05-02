window.addEventListener('load', () => {
	const
		helloThere = document.getElementById('helloThere'),
		code = document.getElementById('code');
	
	typewriter({
		element: helloThere,
		text: 'Hello, there!',
		time: 100,
		audio: true,
		cursor: {
			activated: true,
			type: 1
		},
		callback: () => {
			
			setTimeout(() => {
				typewriter({
					element: helloThere,
					text: 'Hello, there!',
					time: 70,
					forward: false,
					audio: true,
					cursor: {
						activated: true,
						type: 1
					},
					callback: () => {
						typewriter({
							element: helloThere,
							text: 'My name is Oussama Essamadi',
							time: 100,
							audio: true,
							cursor: {
								activated: true,
								type: 1
							},
							callback: () => {
								helloThere.classList.remove('cursor');
								typewriter({
									element: code,
									text: 'I code in ',
									time: 100,
									audio: true,
									cursor: {
										activated: true,
										type: 1
									},
									callback: () => {
										let langs = document.createElement('span');

										helloThere.classList.remove('cursor');
										langs.id = "langs";
										langs.classList.add('text-gray-strong');
										code.appendChild(langs);
										
										typewriter({
											element: langs,
											text: getNextLang(),
											time: 100,
											audio: true,
											callback: () => {
												setInterval(() => {
													typewriter({
														element: langs,
														text: getPrevLang(),
														time: 100,
														forward: false,
														callback: () => {
															typewriter({
																element: langs,
																text: getNextLang(),
																time: 100
															});
														}
													});
												}, 3000);
											}
										});
									}
								});
							}
						});
					}
				});
			}, 1000);
		}
	});
});

const
	LANGUAGES = [
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
	lang = 0;

function getNextLang() {
	let __lang = LANGUAGES[lang];
	if(lang++ >= LANGUAGES.length)
		lang = 0;
	
	return __lang;
}

function getPrevLang() {
	let __index = lang;
	if(--__index < 0)
		__lang = LANGUAGES.length - 1;
	
	return LANGUAGES[__index];
}