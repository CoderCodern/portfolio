export interface About {
	title: string;
	description: string;
	slug: string;
}

export interface Project {
	title: string;
	description: string;
	slug: string;
	poster: string;
	techstack: string[];
	date?: string;
	category?: string;
}

export interface Article {
	title: string;
	description?: string;
	publishedDate: string;
	poster: string;
	slug: string;
	category?: string;
	htmlFile?: string;
}
