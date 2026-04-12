/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	darkMode: "class",
	theme: {
		extend: {
			borderRadius: {
				lg: "8px",
			},
			boxShadow: {
				level1: "0 1px 3px rgba(0,0,0,0.1)",
				level2: "0 4px 6px rgba(0,0,0,0.1)",
				level3: "0 10px 15px rgba(0,0,0,0.1)",
			},
			transitionDuration: {
				100: "100ms",
			},
			fontSize: {
				body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
				h1: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
			},
			colors: {
				primary: "hsl(var(--primary-h) var(--primary-s) var(--primary-l))",
				gray100: "hsl(0 0% 95%)",
				gray700: "hsl(0 0% 40%)",
				gray900: "hsl(0 0% 15%)",
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: "none",
						color: "inherit",
						a: {
							color: "hsl(var(--primary-h) var(--primary-s) 36%)",
							"&:hover": {
								color: "hsl(var(--primary-h) var(--primary-s) 30%)",
							},
						},
						// 添加暗色模式支持
						"html.dark &": {
							color: "inherit",
							a: {
								color: "hsl(var(--primary-h) 68% 72%)",
								"&:hover": {
									color: "hsl(var(--primary-h) 72% 82%)",
								},
							},
						},
					},
				},
			},
		},
	},
	plugins: [require("@tailwindcss/typography")],
};
