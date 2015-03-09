uis.directive('uisMultiple', ['uiSelectMinErr', function(uiSelectMinErr) {
  return {
    restrict: 'EA',
    require: ['^uiSelect', '^ngModel'],
    link: function(scope, element, attrs, ctrls) {

      var $select = ctrls[0];
      var ngModel = ctrls[1];

      $select.multiple = true;

      //Input that will handle focus
      $select.focusInput = $select.searchInput;

      //From view --> model
      ngModel.$parsers.unshift(function () {
        var locals = {},
            result,
            resultMultiple = [];
        for (var j = $select.selected.length - 1; j >= 0; j--) {
          locals = {};
          locals[$select.parserResult.itemName] = $select.selected[j];
          result = $select.parserResult.modelMapper(scope, locals);
          resultMultiple.unshift(result);
        }
        return resultMultiple;
      });

      // From model --> view
      ngModel.$formatters.unshift(function (inputValue) {
        var data = $select.parserResult.source (scope, { $select : {search:''}}), //Overwrite $search
            locals = {},
            result;
        if (data){
          var resultMultiple = [];
          var checkFnMultiple = function(list, value){
            //if the list is empty add the value to the list
            if (!list || !list.length){
                resultMultiple.unshift(value);
                return true;
            }
            for (var p = list.length - 1; p >= 0; p--) {
              locals[$select.parserResult.itemName] = list[p];
              result = $select.parserResult.modelMapper(scope, locals);
              if($select.parserResult.trackByExp){
                  var matches = /\.(.+)/.exec($select.parserResult.trackByExp);
                  if(matches.length>0 && result[matches[1]] == value[matches[1]]){
                      resultMultiple.unshift(list[p]);
                      return true;
                  }
              }
              if (result == value){
                resultMultiple.unshift(list[p]);
                return true;
              }
            }
            return false;
          };
          if (!inputValue) return resultMultiple; //If ngModel was undefined
          for (var k = inputValue.length - 1; k >= 0; k--) {
            if (!checkFnMultiple($select.selected, inputValue[k])){
              checkFnMultiple(data, inputValue[k]);
            }
          }
          return resultMultiple;
        }
        return inputValue;
      });
      
      //Watch selection
      scope.$watchCollection(function(){ return ngModel.$modelValue; }, function(newValue, oldValue) {
        if (oldValue != newValue)
          ngModel.$modelValue = null; //Force scope model value and ngModel value to be out of sync to re-run formatters
      });
      $select.firstPass = true; // so the form doesn't get dirty as soon as it loads
      scope.$watchCollection('$select.selected', function() {
        if (!$select.firstPass) {
          ngModel.$setViewValue(Date.now()); //Set timestamp as a unique string to force changes
        } else {
          $select.firstPass = false;
        }
      });
      
      // focusser.prop('disabled', true); //Focusser isn't needed if multiple

      ngModel.$render = function() {
        // Make sure that model value is array
        if(!angular.isArray(ngModel.$viewValue)){
          // Have tolerance for null or undefined values
          if(angular.isUndefined(ngModel.$viewValue) || ngModel.$viewValue === null){
            $select.selected = [];
          } else {
            throw uiSelectMinErr('multiarr', "Expected model value to be array but got '{0}'", ngModel.$viewValue);
          }
        }
        $select.selected = ngModel.$viewValue;
      };

    }
  };
}]);