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
			text: `and I code in ${getRandLang()}`,
			time: 120,
			audio: true
		}),
		navbar = document.querySelector('nav.navbar'),
		copyDate = document.getElementById('copyDate'),
		btnMute = document.getElementById('mute'),
		muteIcon = btnMute.querySelector('i.fa'),
		btnScrollDown = document.getElementById('scrollDown'),
		btnAboutScroll = document.getElementById('aboutScroll'),
		btnSkillsScroll = document.getElementById('skillsScroll'),
		mainContent = document.getElementById('main-content');

	window.scroll(0, 0);
	mainContent.style.opacity = '0';
	navbar.style.opacity = '0';
	navbar.style.top = '-55px';
	document.body.style.overflow = 'hidden';

	// Typewriter animation
	TypeWriter.volume = 0.2;
	setTimeout(() => {
		mainContent.style.opacity = '1';
		mainContent.classList.remove('load', 'spinner-3');

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
													chars: LANGUAGES[_lang].lang.length,
													callback: () => {
														codeTW.setText(`and I code in ${getRandLang()}`);
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
											btnScrollDown.style.display = 'block';
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
		initYear = 2018,
		currYear = (new Date()).getFullYear();
	
	if (currYear === initYear)
		copyDate.textContent = initYear;
	else
		copyDate.textContent = `${initYear} - ${currYear}`;

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

	btnScrollDown.addEventListener('click', () => {
		window.scrollTo({
			top: document.querySelector('header.landleg').offsetHeight + 1,
			left: 0,
			behavior: 'smooth'
		});
	});

	btnAboutScroll.addEventListener('click', () => {
		window.scrollTo({
			top: document.getElementById('about').offsetTop - 50,
			left: 0,
			behavior: 'smooth'
		});
	});

	btnSkillsScroll.addEventListener('click', () => {
		window.scrollTo({
			top: document.querySelector('div.skills-panel').offsetTop - 80,
			left: 0,
			behavior: 'smooth'
		});
	});

	CreateSkillBoxes();
});

var	_lang = -1;

function getRandLang() {
	_lang = Math.floor(Math.random() * LANGUAGES.length);

	return LANGUAGES[_lang].lang;
}
