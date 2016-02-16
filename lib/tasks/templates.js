
module.exports = function(gulp, config) {

	return function(done) {
		if(!config.templates) return done()
		var c = require('better-console')
		c.info('~ templates')

		var _ = require('lodash')
		var data = require('gulp-data')
		var frontMatter = require('gulp-front-matter')
		var gulpFilter = require('gulp-filter')
		var gulpJade = require('gulp-jade')
		var jade = require('jade')
		var jf = require('jsonfile')
		var path = require('path')

		var filterJade = gulpFilter('**/*.jade', { restore: true })
		var filterStatic = gulpFilter('**/*.{html,htm}', { restore: true })

		var templatesData = {}

		// Read data from external JSON files
		var resolveData = function(value) {
			var resolve = null
			if(typeof value == 'string' && ~value.indexOf('.json')){
				resolve = jf.readFileSync(path.resolve(config.dir, value), { throws: false })
				if(resolve === null) {
					c.error('Error in JSON data parsing for file ' + value)
				}
			}
			return resolve
		}

		if(config.data) {
			for(key in config.data){
				var value = config.data[key]

				// Try to read data from external JSON files
				var resolve = resolveData(value)
				if(resolve !== null) value = resolve

				templatesData[key] = value
			}
		}

		// Default Jade options
		var jadeOptions = {
			jade: jade,
			pretty: true,
			cache: true,
			doctype: 'html'
		}
		if(config.jade) {
			_.assign(jadeOptions, config.jade)
		}

		var task = gulp.src(config.templates)

		templatesData.devmode = config.devmode;
		templatesData.production = !config.devmode;

		task = task.pipe(frontMatter({
					property: 'frontMatter',
					remove: true
			}))
			.pipe(data(function(file) {
				var name = path.basename(file.path)
				var data = _.cloneDeep(templatesData)

				// In case of name == key, assign value as global object
				if(typeof templatesData[name] !== 'undefined') {
					return _.assign(data, templatesData[name], file.frontMatter)
				} else {
					return _.assign(data, file.frontMatter)
				}
			}))
			.pipe(filterJade)
			.pipe(gulpJade(jadeOptions))
			.pipe(filterJade.restore)


		return task.pipe(gulp.dest(config.dist_folder))
	}
}
