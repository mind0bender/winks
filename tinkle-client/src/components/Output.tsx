import {
  HTMLAttributes,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import getThemeClassName, { Color } from "../helper/color";

export interface OutputProps extends HTMLAttributes<HTMLPreElement> {
  text?: string | undefined;
  theme?: Color;
  nextOutputs?: OutputProps[];
  waitBefore?: number;
  waitAfterRounds?: number;
  speedInv?: number;
  timestamp?: Date;
  showTimestamp?: boolean;
}

export default function Output({
  text,
  theme = Color.light,
  nextOutputs = [],
  waitBefore = 0,
  waitAfterRounds = 0,
  speedInv = (text?.length || 0) * 50,
  timestamp,
  showTimestamp = true,
  ...rest
}: OutputProps): JSX.Element {
  const waitAfter: number = waitAfterRounds * 400 * 4;

  const [textIdx, setTextIdx] = useState<number>(0);

  const [isReadyForNextOutputs, setIsReadyForNextOutputs] = useState<boolean>(
    text === undefined
  );

  const [loadingIdx, setLoadingIdx] = useState<number>(0);
  const timeRef: MutableRefObject<Date | undefined> = useRef(timestamp);
  useEffect((): (() => void) => {
    if (text && textIdx === text.length) {
      const id: number = setInterval((): void => {
        setLoadingIdx((prev: number): number => {
          return prev === 3 ? 0 : prev + 1;
        });
      }, 400);
      return (): void => {
        clearInterval(id);
      };
    }

    return (): void => {};
  }, [text, textIdx]);

  useEffect((): (() => void) => {
    if (!text) {
      return (): void => {};
    }
    let id: number;
    setTimeout((): void => {
      id = setInterval((): void => {
        setTextIdx((prev: number): number => {
          if (prev === text.length) {
            clearInterval(id);
            setTimeout((): void => {
              setIsReadyForNextOutputs(true);
            }, waitAfter);
          }
          return prev < text.length ? prev + 1 : prev;
        });
      }, speedInv / text.length);
    }, waitBefore);
    return (): void => {
      clearInterval(id);
    };
  }, [text, waitBefore, waitAfter, speedInv]);

  return (
    <pre {...rest} className={`text-wrap flex flex-col grow`}>
      {text && (
        <code
          className={`flex grow justify-between items-baseline gap-2 py-1 px-4 ${
            showTimestamp && isReadyForNextOutputs && "border-l-4"
          } ${getThemeClassName(theme, true)}`}>
          <div>
            {text.slice(0, textIdx)}
            {textIdx === text.length ? "" : "\u2588"}
            {waitAfter
              ? "...".slice(0, isReadyForNextOutputs ? 3 : loadingIdx)
              : null}
          </div>
          {showTimestamp && (
            <span className={`text-xs text-stone-400`}>
              {timeRef.current?.toLocaleTimeString()}
            </span>
          )}
        </code>
      )}
      {(isReadyForNextOutputs && nextOutputs.length && (
        <Output {...nextOutputs[0]} nextOutputs={nextOutputs.slice(1) || []} />
      )) ||
        null}
    </pre>
  );
}
