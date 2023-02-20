import { MainPath } from '@/components/Decor/MainPath';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { Hero } from '@/components/Hero/Hero';
import { Projects } from '@/components/Projects/Projects';
import { Skills } from '@/components/Skills/Skills';
import styles from './page.module.css';

export default function Home() {
	return (
		<>
			<Header />
			<main>
				<Hero />
				<div className={styles.content}>
					<MainPath />
					<Skills />
					<Projects />
				</div>
			</main>
			<Footer />
		</>
	);
}
