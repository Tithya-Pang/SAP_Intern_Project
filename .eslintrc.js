module.exports = {
  root: true,
  extends: [require.resolve('@umijs/lint/dist/config/eslint')],
  ignorePatterns: ['dist', 'src/.umi', 'src/.umi-production'],
};
