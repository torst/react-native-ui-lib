const _ = require('lodash');
const utils = require('../utils');

const { findAndReportHardCodedValues, propIsColor, isColorException } = utils;
const MAP_SCHEMA = {
  "type": "object",
  "additionalProperties": true
};

module.exports = {
  meta: {
    docs: {
      description: 'disallow hard coded colors',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      uiLib: 'Use UILib colors instead of hardcoded colors.',
    },
    fixable: 'whitespace',
    schema: [
      MAP_SCHEMA,
      MAP_SCHEMA
    ],
  },
  create(context) {
    function reportAndFixHardCodedColorString(node) {
      const colorString = node.extra.rawValue;
      if (!isColorException(colorString)) {
        context.report({
          node,
          message: `Found '${colorString}'. Use UILib colors instead of hardcoded colors.`,
          fix(fixer) {
            if (node.extra) {
              const validColors = context.options[0]; // _.get(context, 'settings.uiLib.validColors');
              const extraColors = context.options[1]; // _.get(context, 'settings.uiLib.extraFixColorMap');
              if (validColors) {
                const validColorsDic = _.chain(validColors).mapValues(value => value.toLowerCase()).invert().value();
                const invertedColorsDict = _.assign({}, validColorsDic, extraColors);
                const lowerCaseColorString = colorString.toLowerCase();
                if (invertedColorsDict[lowerCaseColorString]) {
                  return fixer.replaceText(node, `Colors.${invertedColorsDict[lowerCaseColorString]}`);
                }
              }
            }
          },
        });
      }
    }

    function noHardCodedColors(node) {
      node.properties.forEach((property) => {
        if (property.key) {
          const propName = property.key.name;
          if (propIsColor(propName)) {
            findAndReportHardCodedValues(property.value, reportAndFixHardCodedColorString, context.getScope());
          }
        }
      });
    }

    return {
      'CallExpression[callee.object.name=StyleSheet][callee.property.name=create] ObjectExpression': node =>
        noHardCodedColors(node),
      'JSXAttribute[name.name = style] ObjectExpression': node => noHardCodedColors(node),
    };
  },
};
