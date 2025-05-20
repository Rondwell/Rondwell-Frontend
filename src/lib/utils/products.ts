import Product1 from '$lib/assets/images/Group 1.png';
import Product2 from '$lib/assets/images/Group 2.png';
import Product3 from '$lib/assets/images/Group 3.png';
import Product4 from '$lib/assets/images/Group 4.png';
import Product5 from '$lib/assets/images/Group 5.png';

// Product data array
export const qbl_products: {
	id: number;
	name: string;
	image: string;
	variants: {
		name?: string;
		description: string;
	}[];
}[] = [
	{
		id: 1,
		name: 'Ogogoro',
		image: Product1,
		variants: [
			{
				name: 'Classic',
				description: 'The original palm spirit.'
			},
			{
				name: 'Crema de Naija',
				description: 'A silky cream liqueur inspired by tropical indulgence.'
			},
			{
				name: 'Flavored',
				description: 'Pineapple & Coconut variants for a fresh island twist.'
			}
		]
	},
	{
		id: 2,
		name: 'Waragi',
		image: Product2,
		variants: [
			{
				name: 'Original',
				description: 'Clean, clear, and botanical.'
			},
			{
				name: 'Flavored',
				description: 'Guava & Mango infusions for fruit-forward flair.'
			}
		]
	},
	{
		id: 3,
		name: 'Zobolo Plus',
		image: Product3,
		variants: [
			{
				description: 'Ogogoro meets Zobo in a hibiscus-spiced cocktail. Bold and floral.'
			}
		]
	},
	{
		id: 4,
		name: 'Calmar',
		image: Product4,
		variants: [
			{
				description: 'A zesty Ogogoro + Chapman mix. Bittersweet, citrusy, iconic.'
			}
		]
	},
	{
		id: 5,
		name: 'Zobolo',
		image: Product5,
		variants: [
			{
				description: 'Our take on the classic beloved Zobo.'
			}
		]
	}
];
