(() => {
  class CommentsDashboardController {
    constructor(CommentsService, $interval, Auth, $scope) {
      this.CommentsService = CommentsService;
      this.$interval = $interval;
      this.$scope = $scope;
      this.session = Auth.getSession();
      this.refreshInterval = 1000 * 60 * 15; // 15 min
      this.paging = {
        size: 50,
        totalElements: 0,
        page: 1,
        sort: 'createdAt,DESC'
      };

      this.comments = [];

      /* Will be used as a cache for replacing all usernames with
      * the format [~username~id] before posting the new comment
      */
      this.addedMentions = [];
    }

    $onChanges(changes) {
      if (_.isEmpty(this.id)) {
        return;
      }
      this.load();
    }

    load() {
      this.loadingPromise = this.CommentsService.load(this.id, this.paging).then((response) => {
        this.comments = response.data.content;
        // Total elements
        this.paging.totalElements = response.data.totalElements;
      });

      if (angular.isDefined(this.refreshPromise)) {
        this.$interval.cancel(this.refreshPromise);
      }

      this.refreshPromise = this.$interval(() => {
        this.refresh();
      }, this.refreshInterval);
    }

    refresh() {
      this.CommentsService.load(this.id, this.paging).then((response) => {
        this.comments = response.data.content;
        // Total elements
        this.paging.totalElements = response.data.totalElements;
      });
    }

    $onDestroy() {
      if (angular.isDefined(this.refreshPromise)) {
        this.$interval.cancel(this.refreshPromise);
      }
    }

    close() {
      this.modalInstance.close('Close');
      // Not refresh anymore
      this.CommentsService.disableRefreshing(false);
    }

    changePage() {
      this.load();
    }

    create() {
      this.isSaving = true;

      let _newComment = this.newComment;

      this.comments.push({
        user: this.session,
        createdAt: new Date(),
        text: _newComment
      });
      this.newComment = null;

      // _newComment = _newComment.replace(/@[a-zA-Z0-9]+/g, (match) => {
      //   let username = match.substring(1);
      //   let obj = null;

      //   _.each(this.addedMentions, (val) => {
      //     if (val.username === username) {
      //       obj = val;
      //     }
      //   });

      //   if (obj) {
      //     return `[~${obj.username}~${obj.id}]`;
      //   }
      //   else {
      //     console.warn(`Couldn\'t find user ${match}`);
      //     return match;
      //   }
      // })

      // this.loadingPromise = this.CommentsService.comment(this.id, _newComment, this.entity)
      //   .then((response) => {
      //     this.newComment = null;
      //     // Reload
      //     this.load();
      //   })
      //   .finally(() => {
      //     this.isSaving = false;
      //   });
    }

    typeaheadUsers(term) {
      this.acUsers = [];

      if (term.length >= 1) {
        this.CommentsService.typeaheadUsers(term).then((response) => {
          this.acUsers = response.data;
        });
      }
    }

    selectUser(item) {
      this.addedMentions.push(item);
      return `@${item.username}`;
    }
  }

  angular.module('app').component('commentsDashboard', {
    templateUrl: 'app/directives/comments/comments.dashboard.html',
    controller: CommentsDashboardController,
    bindings: {
      reaction: '='
    }
  });
})();
