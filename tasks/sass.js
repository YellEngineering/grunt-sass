'use strict';
var path = require('path');
var eachAsync = require('each-async');
var assign = require('object-assign');
var sass = require('node-sass');

module.exports = function (grunt) {
	grunt.verbose.writeln('\n' + sass.info + '\n');

	const buildTemplatePlaceholder = (key) => `<%= ${key} %>\n`;

	grunt.registerMultiTask('sass', 'Compile Sass to CSS', function () {
		eachAsync(this.files, function (el, i, next) {
			var opts = this.options({
				precision: 10,
				globalImports: {},
				useGlobalImports: false,
				tempFileExt: ''
			});


			var src = el.src[0];

			if (!src || path.basename(src)[0] === '_') {
				next();
				return;
			}

			// set variable to store which file to use
			let sourceFile = src;

			// new file name
			let tempFileName = null;

			// are we using globalImports?
			if ( opts.useGlobalImports ) {

				// read template
				let templateString = '';

				// create data object to store results
				const data = {};

				opts.globalImports.forEach(({ name, content }) => {
					// if the file exists, read it and store the contents in the data object
					// where the name is basically the key
					// if its not a file, just save contents
					data[name] = grunt.file.exists(content) ? grunt.file.read(content) : content;
					templateString += buildTemplatePlaceholder(name);
				});


				// store contents of current file
				data.sass = grunt.file.read(src);
				templateString += buildTemplatePlaceholder('sass');

				// process template and return output
				let output = grunt.template.process(templateString, { data });

				// get full extension from current filename
				let fullExtension = '.' + src.split('.').splice(1).join('.');

				// replace old extension with new extension
				tempFileName = src.replace(fullExtension, opts.tempFileExt);

				// write tempFile to destination
				grunt.file.write(tempFileName, output, { encoding: 'utf-8' });
				sourceFile = tempFileName;
			}

			sass.render(assign({}, opts, {
				file: sourceFile,
				outFile: el.dest
			}), function(err, res) {
				if (err) {
					grunt.log.error(err.formatted + '\n');
					grunt.warn('');
					next(err);
					return;
				}

				// write compiled file to destination
				grunt.file.write(el.dest, res.css);

				if (opts.sourceMap) {
					grunt.file.write(this.options.sourceMap, res.map);
				}

				// delete temp file
				if ( sourceFile.includes('.processed.scss') ) {
					grunt.file.delete(sourceFile);
				}

				next();
			});

		}.bind(this), this.async());
	});
};
