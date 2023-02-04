Template for ExpressJS Based projects
=====================================

Basic structure and npm dependencies to star a new ExpressJS project


Structure
---------

The directory structure assumes all sources are within the top level ``src`` directory.
Builds will go to the ``build`` directory. Finally, distribution files will go to the
``dist`` directory.

The ``build`` directory is not managed by git.


Build Environment
-----------------

We experimentally chose the `taskr <https://github.com/lukeed/taskr>`_ framework, we will see how it goes.
It seems quite flexible and simple (perhaps too simple).

We defined a few simple jobs within the ``taskfile.js`` spec file.

Linting & style
---------------

We use `tslint <https://palantir.github.io/tslint/>`_ to maintain a set of standards on how to write **ts** code.
For the time being we are using the ``tslint-config-standard`` package
with a few modifications.

The spec for linting is stored in ``tslint.json``, and currently it simply extends the ``tslint-config-standard`` rules.
We should work with them and adapt them to our needs.

Linting is driven from the ``taskr`` **lint** target.

Testing
-------

The test framework we are using is `jest <http://facebook.github.io/jest/>`_

This framework is configured in the file ``jest.config.js``. Modifications  to this file should be avoided.

Tests are driven from the ``spec`` taskr target. Note that no ts compilation is needed to launch the tests
as ``jest`` is making use of the ``ts-jest`` module, which avoids compilation of ``ts`` files.

The `component <https://gitlab.com/ECloud/component>`_ project contains a simple example of using **jest**.

npm scripts
-----------

We also define a few useful npm scripts, which, in turn, delegate to *taskr* targets.

Continuous Integration
----------------------

A very simple, to-be-revised ``.gitlab-ci.yml`` has been added with basic testing and coverage

There is a docker image built for running tests in gitlab. It is similar to a previous one, but this one has a newer nodejs version: 7.10.0.
Testing should proceed on this version as much as possible, with the goal of adopting nodejs 8.x.x as soon as it is released.

Additional notes
----------------

Most configuration files keep on being based on json or yaml.





