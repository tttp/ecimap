'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    uglify: {
      build: {
        src: 'map.js',
        dest: 'build/map.min.js'
      }
    },
  concat: {
      options: {
            separator: ';',
          },
      dist: {
            src: ['js/d3.v3.min.js', 'js/queue.v1.min.js', 'js/topojson.v1.min.js','map.js'],
            dest: 'dist/full.js',
          },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
//  grunt.registerTask('concat', ['concat:default']);
  grunt.registerTask('default', ['uglify','concat']);

};
