module.exports = {
	apps: [
		{
			name: "Dimitra",
			script: "dist/index.js",
			watch: ["dist"],
			ignore_watch: ["node_modules", ".sern", "src"]
		}
	]
};
